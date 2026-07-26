<#
.SYNOPSIS
    Auto 49/50 - USB Compression & Transfer Tool - Core function library.

.DESCRIPTION
    Runspace-safe helper functions used by both the GUI (main runspace) and the
    background worker runspaces. Contains NO WPF/UI code so it can be imported
    anywhere. Covers:
        * Configuration load / save / validation
        * 7-Zip discovery and archive creation
        * SHA-256 / MD5 hashing and manifest generation
        * Network-share transfer (robocopy with Copy-Item fallback) + verification
        * Live system statistics (CPU, RAM, network, temp-folder space)
        * Structured logging

    Author : Auto4950 Tooling
    Licence : Internal use
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

#region ------------------------------------------------------------ Configuration

# Default configuration used when no config file exists yet.
function Get-DefaultConfig {
    [CmdletBinding()]
    param()
    [ordered]@{
        # --- Destination -------------------------------------------------------
        NetworkShare        = '\\SERVER\Evidence$'   # UNC path files are transferred to
        # --- Tooling -----------------------------------------------------------
        SevenZipPath        = ''                       # Auto-detected if blank
        # --- Case / naming -----------------------------------------------------
        CasePrefix          = 'CMS-A'                  # Enforced prefix for case numbers
        # --- Compression -------------------------------------------------------
        CompressionLevel    = 5                        # 0 (store) .. 9 (ultra)
        ArchiveFormat       = 'zip'                     # zip | 7z
        SplitPerTopLevel    = $true                    # One archive per top-level item (enables pipelining)
        VolumeSizeMB        = 2048                      # Split archives into volumes of this size (MB). 0 = no split
        Password            = ''                       # Optional AES-256 archive password (blank = none)
        # --- Hashing -----------------------------------------------------------
        HashAlgorithms      = @('SHA256', 'MD5')       # Original-file hashing
        EmbedManifest       = $true                    # Include hash manifest inside each archive
        # --- Behaviour ---------------------------------------------------------
        AutoPromptOnInsert  = $true                    # Show the action prompt when a USB drive appears
        DefaultSelectAll    = $true                    # Pre-select all folders/files by default
        VerifyAfterTransfer = $true                    # Re-hash the archive at destination
        DeleteLocalArchive  = $false                   # Remove staged archive after successful transfer
        StagingFolder       = '$env:TEMP\Auto4950'  # Where archives are staged before transfer
        # --- Excludes ----------------------------------------------------------
        ExcludePatterns     = @('System Volume Information', '$RECYCLE.BIN', 'Thumbs.db')
    }
}

function Get-ConfigPath {
    [CmdletBinding()]
    param([string]$Root)
    if (-not $Root) { $Root = Split-Path -Parent $PSScriptRoot }
    Join-Path $Root 'config.json'
}

function Import-A4950Config {
    <#
    .SYNOPSIS Load configuration from config.json, falling back to defaults.
    #>
    [CmdletBinding()]
    param([string]$Path)

    if (-not $Path) { $Path = Get-ConfigPath }
    $config = Get-DefaultConfig

    if (Test-Path -LiteralPath $Path) {
        try {
            $raw = Get-Content -LiteralPath $Path -Raw -Encoding UTF8 | ConvertFrom-Json
            foreach ($p in $raw.PSObject.Properties) {
                # Overlay saved values onto the default template (keeps new keys).
                $config[$p.Name] = $p.Value
            }
        } catch {
            Write-Warning "Failed to parse '$Path': $($_.Exception.Message). Using defaults."
        }
    }
    # Expand environment variables inside path-like values.
    $config['StagingFolder'] = [Environment]::ExpandEnvironmentVariables($config['StagingFolder'])
    return $config
}

function Save-A4950Config {
    <#
    .SYNOPSIS Persist configuration to config.json.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)] $Config,
        [string]$Path
    )
    if (-not $Path) { $Path = Get-ConfigPath }
    $Config | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $Path -Encoding UTF8
    return $Path
}

function Test-A4950Config {
    <#
    .SYNOPSIS Validate a configuration object. Returns a list of problem strings (empty = OK).
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)] $Config)

    $issues = New-Object System.Collections.Generic.List[string]

    if ([string]::IsNullOrWhiteSpace($Config.NetworkShare)) {
        $issues.Add('Network share is not set.')
    }
    $sz = Resolve-SevenZip -PreferredPath $Config.SevenZipPath
    if (-not $sz) {
        $issues.Add('7-Zip (7z.exe) could not be located. Install it or set SevenZipPath.')
    }
    if ($Config.CompressionLevel -lt 0 -or $Config.CompressionLevel -gt 9) {
        $issues.Add('CompressionLevel must be between 0 and 9.')
    }
    if (-not $Config.CasePrefix) {
        $issues.Add('CasePrefix must not be empty.')
    }
    return $issues
}

#endregion

#region ------------------------------------------------------------ 7-Zip discovery / compression

function Resolve-SevenZip {
    <#
    .SYNOPSIS Locate the 7-Zip command-line executable.
    .DESCRIPTION
        The 7-Zip installer does NOT add itself to PATH, so detection can't rely
        on Get-Command alone. This checks, in order:
          1. An explicit preferred path (from config).
          2. The registry install path the 7-Zip installer writes (most reliable).
          3. PATH (Get-Command), in case it was added manually.
          4. Common install locations (Program Files, per-user, winget, choco, scoop).
          5. The uninstall registry's InstallLocation.
          6. A bounded search of the Program Files 7-Zip folders.
        Falls back to the standalone 7za.exe if the full 7z.exe isn't present.
    #>
    [CmdletBinding()]
    param([string]$PreferredPath)

    function Test-Exe([string]$p) { $p -and (Test-Path -LiteralPath $p -PathType Leaf) }

    # 1. Explicit preferred path (accept a folder too).
    if ($PreferredPath) {
        if (Test-Exe $PreferredPath) { return $PreferredPath }
        $j = Join-Path $PreferredPath '7z.exe'
        if (Test-Exe $j) { return $j }
    }

    # 2. Registry install path (HKLM/HKCU, native + WOW6432Node). Path64 preferred.
    $regKeys = @(
        'HKLM:\SOFTWARE\7-Zip'
        'HKLM:\SOFTWARE\WOW6432Node\7-Zip'
        'HKCU:\SOFTWARE\7-Zip'
    )
    foreach ($k in $regKeys) {
        try {
            $props = Get-ItemProperty -Path $k -ErrorAction SilentlyContinue
            if ($props) {
                $vals = @()
                # Index the properties collection (StrictMode-safe: absent = $null, no throw).
                if ($props.PSObject.Properties['Path64']) { $vals += $props.Path64 }
                if ($props.PSObject.Properties['Path'])   { $vals += $props.Path }
                foreach ($val in $vals) {
                    if ($val) {
                        $exe = Join-Path $val '7z.exe'
                        if (Test-Exe $exe) { return $exe }
                    }
                }
            }
        } catch {}
    }

    # 3. On PATH (only if the user added it).
    $cmd = Get-Command '7z.exe' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($cmd) { return $cmd.Source }

    # 4. Common install locations.
    $dirs = @(
        $env:ProgramW6432
        $env:ProgramFiles
        ${env:ProgramFiles(x86)}
        "$env:LOCALAPPDATA\Programs"
        "$env:ProgramData\chocolatey\bin"
        "$env:LOCALAPPDATA\Microsoft\WinGet\Links"
        "$env:USERPROFILE\scoop\shims"
        "$env:USERPROFILE\scoop\apps\7zip\current"
    ) | Where-Object { $_ }
    foreach ($d in $dirs) {
        foreach ($exe in @('7z.exe', '7za.exe')) {
            $p1 = Join-Path $d "7-Zip\$exe"
            $p2 = Join-Path $d $exe
            if (Test-Exe $p1) { return $p1 }
            if (Test-Exe $p2) { return $p2 }
        }
    }

    # 5. Uninstall registry InstallLocation.
    $uninst = @(
        'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\7-Zip'
        'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\7-Zip'
    )
    foreach ($k in $uninst) {
        try {
            $up = Get-ItemProperty -Path $k -ErrorAction SilentlyContinue
            if ($up -and $up.PSObject.Properties['InstallLocation'] -and $up.InstallLocation) {
                $exe = Join-Path $up.InstallLocation '7z.exe'
                if (Test-Exe $exe) { return $exe }
            }
        } catch {}
    }

    # 6. Bounded search under Program Files (last resort; fast, top 2 levels).
    foreach ($base in @($env:ProgramW6432, $env:ProgramFiles, ${env:ProgramFiles(x86)}) | Where-Object { $_ } | Select-Object -Unique) {
        try {
            $hit = Get-ChildItem -Path $base -Filter '7z.exe' -Recurse -Depth 2 -ErrorAction SilentlyContinue |
                Select-Object -First 1
            if ($hit) { return $hit.FullName }
        } catch {}
    }

    return $null
}

function New-A4950Archive {
    <#
    .SYNOPSIS Create a 7-Zip archive from a source path.
    .DESCRIPTION
        Wraps 7z.exe. Returns a result object with Success, ArchivePath and Output.
        Streams 7z stdout to the optional -OnOutput scriptblock for live logging.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$SevenZipPath,
        [Parameter(Mandatory)][string]$SourcePath,
        [Parameter(Mandatory)][string]$ArchivePath,
        [ValidateRange(0, 9)][int]$Level = 5,
        [ValidateSet('7z', 'zip')][string]$Format = 'zip',
        [int]$VolumeSizeMB = 0,          # >0 splits the archive into volumes of this size (MB)
        [string]$Password,
        [string[]]$ExcludePatterns,
        [string[]]$ExtraFiles,          # Additional files to add (e.g. the manifest)
        [scriptblock]$OnOutput
    )

    $archiveDir = Split-Path -Parent $ArchivePath
    if (-not (Test-Path -LiteralPath $archiveDir)) {
        New-Item -ItemType Directory -Path $archiveDir -Force | Out-Null
    }
    $archiveLeaf = Split-Path -Leaf $ArchivePath

    # Remove any stale output from a previous run so volume detection is clean.
    Get-ChildItem -LiteralPath $archiveDir -Filter "$archiveLeaf*" -ErrorAction SilentlyContinue |
        Remove-Item -Force -ErrorAction SilentlyContinue

    # Build 7z argument list.  'a' = add, -mx = level, -t = type, -bsp1 = progress to stdout.
    $szArgs = [System.Collections.Generic.List[string]]::new()
    $szArgs.AddRange([string[]]@('a', "-t$Format", "-mx=$Level", '-bsp1', '-y', $ArchivePath, $SourcePath))
    if ($Format -eq '7z') { $szArgs.Add('-mmt=on') }          # multi-threaded
    if ($VolumeSizeMB -gt 0) { $szArgs.Add("-v${VolumeSizeMB}m") }   # split into volumes
    if ($ExtraFiles)      { foreach ($ef in $ExtraFiles) { $szArgs.Add($ef) } }
    if ($Password) {
        $szArgs.Add("-p$Password")
        if ($Format -eq '7z') { $szArgs.Add('-mhe=on') }      # encrypt headers too
    }
    if ($ExcludePatterns) {
        foreach ($x in $ExcludePatterns) { $szArgs.Add("-xr!$x") }
    }

    $result = [pscustomobject]@{
        Success     = $false
        ArchivePath = $ArchivePath
        Files       = @()               # actual output file(s): the archive, or its volume parts
        IsSplit      = ($VolumeSizeMB -gt 0)
        ExitCode    = -1
        Output      = ''
    }

    $sb = New-Object System.Text.StringBuilder
    # Run inline so we can stream output for live logging.
    & $SevenZipPath @szArgs 2>&1 | ForEach-Object {
        $line = "$_"
        [void]$sb.AppendLine($line)
        if ($OnOutput) { & $OnOutput $line }
    }
    $result.ExitCode = $LASTEXITCODE
    $result.Output   = $sb.ToString()

    # Determine the produced file(s). With -v, 7-Zip writes <archive>.001, .002, ...
    if ($VolumeSizeMB -gt 0) {
        $vols = Get-ChildItem -LiteralPath $archiveDir -Filter "$archiveLeaf.*" -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -match '\.\d{3}$' } | Sort-Object Name
        if ($vols) { $result.Files = @($vols.FullName) }
        elseif (Test-Path -LiteralPath $ArchivePath) { $result.Files = @($ArchivePath) }  # not actually split
    } else {
        if (Test-Path -LiteralPath $ArchivePath) { $result.Files = @($ArchivePath) }
    }

    # 7-Zip exit codes: 0 = OK, 1 = warning (still usable).
    $result.Success = ($result.ExitCode -in 0, 1) -and ($result.Files.Count -gt 0)
    return $result
}

#endregion

#region ------------------------------------------------------------ Hashing / manifest

function Get-A4950FileHashes {
    <#
    .SYNOPSIS Compute the requested hash algorithms for a single file.
    .OUTPUTS Hashtable keyed by algorithm name.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Path,
        [string[]]$Algorithms = @('SHA256', 'MD5')
    )
    $out = @{}
    foreach ($alg in $Algorithms) {
        try {
            $out[$alg] = (Get-FileHash -LiteralPath $Path -Algorithm $alg).Hash
        } catch {
            $out[$alg] = "ERROR: $($_.Exception.Message)"
        }
    }
    return $out
}

function New-A4950Manifest {
    <#
    .SYNOPSIS Hash every file under a source path and write a manifest file.
    .DESCRIPTION
        Produces a human-readable manifest and returns the manifest path plus the
        list of hashed records. Reports progress via -OnProgress { param($current,$total,$file) }.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$SourcePath,
        [Parameter(Mandatory)][string]$ManifestPath,
        [string]$CaseNumber = '',
        [string[]]$Algorithms = @('SHA256', 'MD5'),
        [scriptblock]$OnProgress
    )

    $files = @()
    if (Test-Path -LiteralPath $SourcePath -PathType Container) {
        $files = Get-ChildItem -LiteralPath $SourcePath -Recurse -File -Force -ErrorAction SilentlyContinue
    } else {
        $files = @(Get-Item -LiteralPath $SourcePath)
    }

    $records = New-Object System.Collections.Generic.List[object]
    $total = $files.Count
    $i = 0
    foreach ($f in $files) {
        $i++
        if ($OnProgress) { & $OnProgress $i $total $f.FullName }
        $h = Get-A4950FileHashes -Path $f.FullName -Algorithms $Algorithms
        $rel = $f.FullName
        if ($f.FullName.Length -gt $SourcePath.Length -and $f.FullName.StartsWith($SourcePath)) {
            $rel = $f.FullName.Substring($SourcePath.Length).TrimStart('\', '/')
        }
        if ([string]::IsNullOrWhiteSpace($rel)) { $rel = $f.Name }
        $rec = [ordered]@{
            RelativePath = $rel
            SizeBytes    = $f.Length
            Modified     = $f.LastWriteTimeUtc.ToString('o')
        }
        foreach ($alg in $Algorithms) { $rec[$alg] = $h[$alg] }
        $records.Add([pscustomobject]$rec)
    }

    # Write a clear, forensics-friendly manifest.
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.AppendLine('Auto4950 USB Transfer - Hash Manifest')
    [void]$sb.AppendLine('========================================')
    [void]$sb.AppendLine("Case Number   : $CaseNumber")
    [void]$sb.AppendLine("Source        : $SourcePath")
    [void]$sb.AppendLine("Generated UTC : $([DateTime]::UtcNow.ToString('o'))")
    [void]$sb.AppendLine("Machine       : $env:COMPUTERNAME")
    [void]$sb.AppendLine("Operator      : $env:USERNAME")
    [void]$sb.AppendLine("File Count    : $total")
    [void]$sb.AppendLine("Algorithms    : $($Algorithms -join ', ')")
    [void]$sb.AppendLine('')
    foreach ($r in $records) {
        [void]$sb.AppendLine("FILE : $($r.RelativePath)")
        [void]$sb.AppendLine("  Size     : $($r.SizeBytes) bytes")
        [void]$sb.AppendLine("  Modified : $($r.Modified)")
        foreach ($alg in $Algorithms) { [void]$sb.AppendLine("  $($alg.PadRight(8)): $($r.$alg)") }
        [void]$sb.AppendLine('')
    }

    $dir = Split-Path -Parent $ManifestPath
    if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    $sb.ToString() | Set-Content -LiteralPath $ManifestPath -Encoding UTF8

    # Also emit a CSV alongside for machine parsing.
    $csvPath = [IO.Path]::ChangeExtension($ManifestPath, 'csv')
    $records | Export-Csv -LiteralPath $csvPath -NoTypeInformation -Encoding UTF8

    return [pscustomobject]@{
        ManifestPath = $ManifestPath
        CsvPath      = $csvPath
        Records      = $records
        FileCount    = $total
    }
}

#endregion

#region ------------------------------------------------------------ Transfer

function Copy-A4950ToShare {
    <#
    .SYNOPSIS Copy a file to the destination share, preferring robocopy for resilience.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$SourceFile,
        [Parameter(Mandatory)][string]$DestinationFolder,
        [scriptblock]$OnOutput
    )

    if (-not (Test-Path -LiteralPath $DestinationFolder)) {
        New-Item -ItemType Directory -Path $DestinationFolder -Force | Out-Null
    }

    $srcDir  = Split-Path -Parent $SourceFile
    $srcName = Split-Path -Leaf   $SourceFile
    $result  = [pscustomobject]@{ Success = $false; ExitCode = -1; Destination = (Join-Path $DestinationFolder $srcName) }

    $robocopy = Get-Command robocopy.exe -ErrorAction SilentlyContinue
    if ($robocopy) {
        # /J unbuffered I/O = fast for large files, /R:3 /W:5 retry, /NP no per-% spam.
        $rcArgs = @($srcDir, $DestinationFolder, $srcName, '/J', '/R:3', '/W:5', '/NP', '/NDL', '/NJH', '/NJS')
        & $robocopy.Source @rcArgs 2>&1 | ForEach-Object { if ($OnOutput) { & $OnOutput "$_" } }
        $result.ExitCode = $LASTEXITCODE
        # Robocopy success codes are 0-7.
        $result.Success = ($LASTEXITCODE -lt 8) -and (Test-Path -LiteralPath $result.Destination)
    } else {
        Copy-Item -LiteralPath $SourceFile -Destination $result.Destination -Force
        $result.ExitCode = 0
        $result.Success = Test-Path -LiteralPath $result.Destination
    }
    return $result
}

function Test-A4950TransferIntegrity {
    <#
    .SYNOPSIS Verify a transferred file matches the source by SHA-256.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$SourceFile,
        [Parameter(Mandatory)][string]$DestinationFile
    )
    if (-not (Test-Path -LiteralPath $DestinationFile)) {
        return [pscustomobject]@{ Match = $false; Reason = 'Destination file missing' }
    }
    $s = (Get-FileHash -LiteralPath $SourceFile -Algorithm SHA256).Hash
    $d = (Get-FileHash -LiteralPath $DestinationFile -Algorithm SHA256).Hash
    return [pscustomobject]@{
        Match       = ($s -eq $d)
        SourceHash  = $s
        DestHash    = $d
        Reason      = if ($s -eq $d) { 'OK' } else { 'SHA-256 mismatch' }
    }
}

#endregion

#region ------------------------------------------------------------ System statistics

function Get-A4950SystemStats {
    <#
    .SYNOPSIS Snapshot CPU %, memory, network throughput and temp-folder free space.
    .DESCRIPTION
        Network throughput is computed from the delta against -Previous (a prior
        return value). Pass the previous snapshot to get a per-second rate.
    #>
    [CmdletBinding()]
    param(
        [string]$TempPath = $env:TEMP,
        $Previous
    )

    $now = Get-Date

    # --- CPU -------------------------------------------------------------------
    $cpu = 0.0
    try {
        $cpu = [math]::Round((Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average, 0)
    } catch {}

    # --- Memory ----------------------------------------------------------------
    $memTotalMB = 0; $memFreeMB = 0; $memUsedPct = 0
    try {
        $os = Get-CimInstance Win32_OperatingSystem
        $memTotalMB = [math]::Round($os.TotalVisibleMemorySize / 1KB, 0)
        $memFreeMB  = [math]::Round($os.FreePhysicalMemory / 1KB, 0)
        if ($memTotalMB -gt 0) { $memUsedPct = [math]::Round(100 * ($memTotalMB - $memFreeMB) / $memTotalMB, 0) }
    } catch {}

    # --- Network (cumulative bytes across up interfaces) -----------------------
    $bytesTotal = 0
    try {
        $bytesTotal = (Get-NetAdapterStatistics -ErrorAction SilentlyContinue |
            Measure-Object -Property ReceivedBytes, SentBytes -Sum |
            Measure-Object -Property Sum -Sum).Sum
    } catch {}
    $netMbps = 0.0
    if ($Previous -and $Previous.RawNetBytes -gt 0 -and $bytesTotal -gt 0) {
        $seconds = ($now - $Previous.Timestamp).TotalSeconds
        if ($seconds -gt 0) {
            $deltaBytes = $bytesTotal - $Previous.RawNetBytes
            if ($deltaBytes -lt 0) { $deltaBytes = 0 }
            $netMbps = [math]::Round(($deltaBytes * 8) / 1MB / $seconds, 1)   # Megabits/sec
        }
    }

    # --- Temp folder space -----------------------------------------------------
    $tempFreeGB = 0; $tempTotalGB = 0
    try {
        $drive = (Get-Item -LiteralPath $TempPath).PSDrive
        if ($drive) {
            $tempFreeGB  = [math]::Round($drive.Free / 1GB, 1)
            $tempTotalGB = [math]::Round(($drive.Free + $drive.Used) / 1GB, 1)
        }
    } catch {}

    [pscustomobject]@{
        Timestamp    = $now
        CpuPercent   = [double]$cpu
        MemUsedPct   = [double]$memUsedPct
        MemUsedMB    = [double]($memTotalMB - $memFreeMB)
        MemTotalMB   = [double]$memTotalMB
        NetMbps      = [double]$netMbps
        RawNetBytes  = [double]$bytesTotal
        TempFreeGB   = [double]$tempFreeGB
        TempTotalGB  = [double]$tempTotalGB
    }
}

#endregion

#region ------------------------------------------------------------ Logging & utilities

function New-A4950CaseFolderName {
    <#
    .SYNOPSIS Sanitise a case number into a filesystem-safe name.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$CaseNumber)
    $invalid = [IO.Path]::GetInvalidFileNameChars() -join ''
    $pattern = "[{0}]" -f [regex]::Escape($invalid)
    ($CaseNumber -replace $pattern, '_').Trim()
}

function Test-A4950CaseNumber {
    <#
    .SYNOPSIS Validate a case number against the required prefix.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$CaseNumber,
        [string]$Prefix = 'CMS-A'
    )
    if ([string]::IsNullOrWhiteSpace($CaseNumber)) { return $false }
    if (-not $CaseNumber.StartsWith($Prefix, [StringComparison]::OrdinalIgnoreCase)) { return $false }
    # Require at least one character after the prefix.
    return $CaseNumber.Length -gt $Prefix.Length
}

function Write-A4950Log {
    <#
    .SYNOPSIS Append a timestamped, levelled line to a log file.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string]$Message,
        [ValidateSet('INFO', 'WARN', 'ERROR', 'OK', 'STEP')][string]$Level = 'INFO'
    )
    $line = "{0} [{1}] {2}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level.PadRight(5), $Message
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    Add-Content -LiteralPath $Path -Value $line -Encoding UTF8
    return $line
}

#endregion

Export-ModuleMember -Function *
