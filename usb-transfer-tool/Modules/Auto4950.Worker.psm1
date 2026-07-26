<#
.SYNOPSIS
    Auto 49/50 - USB Transfer - background pipeline worker.

.DESCRIPTION
    Runs the full capture pipeline off the UI thread. Implements a producer/
    consumer pipeline so that transfer of a completed archive begins while the
    next item is still compressing ("start transferring as soon as the first
    file is zipped").

    Communication with the GUI happens through a synchronized hashtable ($Shared):
        $Shared.Messages : System.Collections.Queue (synchronized)  - log/progress events
        $Shared.Cancel   : [bool]                                   - cooperative cancel flag
        $Shared.Running  : [bool]                                   - set false when finished

    The GUI drains $Shared.Messages on a DispatcherTimer and updates the UI.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Send-A4950Event {
    <#
    .SYNOPSIS Enqueue a structured event for the GUI to consume.
    #>
    param(
        [Parameter(Mandatory)] $Shared,
        [Parameter(Mandatory)][string]$Type,   # log | progress | status | stat | done
        [hashtable]$Data = @{}
    )
    $evt = @{ Type = $Type; Time = (Get-Date) } + $Data
    $Shared.Messages.Enqueue($evt)
}

function Write-A4950WorkerLog {
    param(
        [Parameter(Mandatory)] $Shared,
        [Parameter(Mandatory)][string]$Message,
        [ValidateSet('INFO', 'WARN', 'ERROR', 'OK', 'STEP')][string]$Level = 'INFO'
    )
    Send-A4950Event -Shared $Shared -Type 'log' -Data @{ Level = $Level; Text = $Message }
    if ($Shared.LogFile) {
        try { Write-A4950Log -Path $Shared.LogFile -Message $Message -Level $Level } catch {}
    }
}

function Invoke-A4950TransferJob {
    <#
    .SYNOPSIS Execute the compress -> hash -> transfer -> verify pipeline.
    .PARAMETER Shared
        Synchronized hashtable carrying config, job parameters and the message queue.
        Required keys: Config, CaseNumber, DriveRoot, Items (string[] top-level paths),
        Messages (Queue), Cancel (bool), LogFile (string).
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)] $Shared)

    $cfg        = $Shared.Config
    $case       = $Shared.CaseNumber
    $caseSafe   = New-A4950CaseFolderName -CaseNumber $case
    $items      = @($Shared.Items)
    $sevenZip   = Resolve-SevenZip -PreferredPath $cfg.SevenZipPath
    $staging    = Join-Path ([Environment]::ExpandEnvironmentVariables($cfg.StagingFolder)) $caseSafe
    $destFolder = Join-Path $cfg.NetworkShare $caseSafe

    try {
        Write-A4950WorkerLog $Shared "=== Job started for case $case ===" 'STEP'
        Write-A4950WorkerLog $Shared "7-Zip      : $sevenZip"
        Write-A4950WorkerLog $Shared "Staging    : $staging"
        Write-A4950WorkerLog $Shared "Destination: $destFolder"
        Write-A4950WorkerLog $Shared "Items      : $($items.Count) top-level selection(s)"

        if (-not $sevenZip) { throw '7-Zip executable not found. Aborting.' }
        if (-not (Test-Path -LiteralPath $staging)) { New-Item -ItemType Directory -Path $staging -Force | Out-Null }

        # Thread-safe queue of archives ready to transfer.
        $transferQueue = [System.Collections.Concurrent.ConcurrentQueue[string]]::new()
        $producerDone  = [ref]$false

        # ---------------------------------------------------------------------
        # Consumer runspace: transfers archives as they appear in the queue.
        # ---------------------------------------------------------------------
        $iss = [System.Management.Automation.Runspaces.InitialSessionState]::CreateDefault()
        $consumerRs = [runspacefactory]::CreateRunspace($iss)
        $consumerRs.ApartmentState = 'MTA'
        $consumerRs.Open()
        $consumerPs = [powershell]::Create()
        $consumerPs.Runspace = $consumerRs

        $consumerResult = [System.Collections.Concurrent.ConcurrentBag[object]]::new()

        [void]$consumerPs.AddScript({
            param($Shared, $Queue, $ProducerDone, $DestFolder, $CoreModule, $WorkerModule, $ResultBag)
            Import-Module $CoreModule -Force
            Import-Module $WorkerModule -Force
            $cfg = $Shared.Config
            while ($true) {
                if ($Shared.Cancel) { break }
                $archive = $null
                if ($Queue.TryDequeue([ref]$archive)) {
                    $name = Split-Path -Leaf $archive
                    Write-A4950WorkerLog $Shared "Transferring: $name" 'STEP'
                    $t = Copy-A4950ToShare -SourceFile $archive -DestinationFolder $DestFolder `
                            -OnOutput ({ param($l) if ("$l".Trim()) { Send-A4950Event -Shared $Shared -Type 'log' -Data @{ Level='INFO'; Text = "  robocopy> $l" } } }.GetNewClosure())
                    if ($t.Success) {
                        Write-A4950WorkerLog $Shared "Transferred: $name" 'OK'
                        if ($cfg.VerifyAfterTransfer) {
                            $v = Test-A4950TransferIntegrity -SourceFile $archive -DestinationFile $t.Destination
                            if ($v.Match) { Write-A4950WorkerLog $Shared "Verified   : $name (SHA-256 match)" 'OK' }
                            else          { Write-A4950WorkerLog $Shared "VERIFY FAIL: $name - $($v.Reason)" 'ERROR' }
                        }
                        if ($cfg.DeleteLocalArchive) {
                            Remove-Item -LiteralPath $archive -Force -ErrorAction SilentlyContinue
                            Write-A4950WorkerLog $Shared "Cleaned    : local $name removed" 'INFO'
                        }
                        $ResultBag.Add(@{ Archive = $name; Transferred = $true })
                    } else {
                        Write-A4950WorkerLog $Shared "TRANSFER FAIL: $name (exit $($t.ExitCode))" 'ERROR'
                        $ResultBag.Add(@{ Archive = $name; Transferred = $false })
                    }
                } elseif ($ProducerDone.Value) {
                    break   # nothing left and producer finished
                } else {
                    Start-Sleep -Milliseconds 200
                }
            }
        })
        [void]$consumerPs.AddArgument($Shared)
        [void]$consumerPs.AddArgument($transferQueue)
        [void]$consumerPs.AddArgument($producerDone)
        [void]$consumerPs.AddArgument($destFolder)
        [void]$consumerPs.AddArgument($Shared.CoreModule)
        [void]$consumerPs.AddArgument($Shared.WorkerModule)
        [void]$consumerPs.AddArgument($consumerResult)
        $consumerHandle = $consumerPs.BeginInvoke()

        # ---------------------------------------------------------------------
        # Producer: hash + compress each top-level item, enqueue for transfer.
        # ---------------------------------------------------------------------
        $totalItems = $items.Count
        $idx = 0
        foreach ($item in $items) {
            if ($Shared.Cancel) { Write-A4950WorkerLog $Shared 'Cancellation requested - stopping.' 'WARN'; break }
            $idx++
            $itemName = Split-Path -Leaf $item.TrimEnd('\', '/')
            if (-not $itemName) { $itemName = 'root' }
            Send-A4950Event -Shared $Shared -Type 'progress' -Data @{ Stage = 'item'; Current = $idx; Total = $totalItems; Name = $itemName }
            Write-A4950WorkerLog $Shared "--- [$idx/$totalItems] Processing '$itemName' ---" 'STEP'

            # 1) Hash originals -> manifest
            $manifestPath = Join-Path $staging ("{0}__{1}_MANIFEST.txt" -f $caseSafe, $itemName)
            $extraFiles = @()
            if ($cfg.EmbedManifest) {
                Write-A4950WorkerLog $Shared "Hashing originals ($($cfg.HashAlgorithms -join ', '))..."
                $m = New-A4950Manifest -SourcePath $item -ManifestPath $manifestPath -CaseNumber $case `
                        -Algorithms $cfg.HashAlgorithms `
                        -OnProgress ({
                            param($c, $t, $f)
                            if ($t -gt 0 -and ($c % 25 -eq 0 -or $c -eq $t)) {
                                Send-A4950Event -Shared $Shared -Type 'progress' -Data @{ Stage='hash'; Current=$c; Total=$t; Name=(Split-Path -Leaf $f) }
                            }
                        }.GetNewClosure())
                Write-A4950WorkerLog $Shared "Manifest   : $($m.FileCount) files hashed -> $(Split-Path -Leaf $manifestPath)" 'OK'
                $extraFiles = @($manifestPath, $m.CsvPath)
            }

            # 2) Compress (with manifest embedded). Split into volumes if configured.
            $volMB = 0
            if ($cfg.PSObject.Properties['VolumeSizeMB']) { $volMB = [int]$cfg.VolumeSizeMB }
            elseif ($cfg -is [System.Collections.IDictionary] -and $cfg.Contains('VolumeSizeMB')) { $volMB = [int]$cfg.VolumeSizeMB }
            $archivePath = Join-Path $staging ("{0}__{1}.{2}" -f $caseSafe, $itemName, $cfg.ArchiveFormat)
            $splitNote = if ($volMB -gt 0) { " split @ ${volMB} MB" } else { '' }
            Write-A4950WorkerLog $Shared "Compressing: $itemName -> $(Split-Path -Leaf $archivePath) (level $($cfg.CompressionLevel)$splitNote)" 'STEP'
            $a = New-A4950Archive -SevenZipPath $sevenZip -SourcePath $item -ArchivePath $archivePath `
                    -Level $cfg.CompressionLevel -Format $cfg.ArchiveFormat -VolumeSizeMB $volMB -Password $cfg.Password `
                    -ExcludePatterns $cfg.ExcludePatterns -ExtraFiles $extraFiles `
                    -OnOutput ({
                        param($l)
                        if ("$l" -match '(\d+)%') {
                            Send-A4950Event -Shared $Shared -Type 'progress' -Data @{ Stage='compress'; Percent=[int]$Matches[1]; Name=$itemName }
                        }
                    }.GetNewClosure())

            if ($a.Success) {
                $parts = @($a.Files)
                $desc = if ($parts.Count -gt 1) { "$($parts.Count) volume(s)" } else { Split-Path -Leaf $parts[0] }
                Write-A4950WorkerLog $Shared "Compressed : $itemName -> $desc" 'OK'
                # Hand each produced file off to the transfer consumer immediately -> pipelined.
                foreach ($p in $parts) {
                    $transferQueue.Enqueue($p)
                    Write-A4950WorkerLog $Shared "Queued for transfer: $(Split-Path -Leaf $p)" 'INFO'
                }
            } else {
                Write-A4950WorkerLog $Shared "COMPRESS FAIL: $itemName (exit $($a.ExitCode))" 'ERROR'
            }
        }

        # Signal producer completion and wait for the consumer to drain.
        $producerDone.Value = $true
        Write-A4950WorkerLog $Shared 'All items compressed. Waiting for transfers to finish...' 'STEP'
        $consumerPs.EndInvoke($consumerHandle)
        $consumerPs.Dispose(); $consumerRs.Dispose()

        $ok = ($consumerResult | Where-Object { $_.Transferred }).Count
        $fail = ($consumerResult | Where-Object { -not $_.Transferred }).Count
        Write-A4950WorkerLog $Shared "=== Job complete: $ok transferred, $fail failed ===" ($(if ($fail) {'WARN'} else {'OK'}))
        Send-A4950Event -Shared $Shared -Type 'done' -Data @{ Ok = $ok; Fail = $fail; Destination = $destFolder }
    }
    catch {
        Write-A4950WorkerLog $Shared "FATAL: $($_.Exception.Message)" 'ERROR'
        Send-A4950Event -Shared $Shared -Type 'done' -Data @{ Ok = 0; Fail = 1; Error = $_.Exception.Message }
    }
    finally {
        $Shared.Running = $false
    }
}

Export-ModuleMember -Function *
