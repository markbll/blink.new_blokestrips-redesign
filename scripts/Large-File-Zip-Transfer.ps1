# Add required assemblies for GUI
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# --- 1. Check for 7-Zip Installation ---
$7zPath = "C:\Program Files\7-Zip\7z.exe"
if (-not (Test-Path $7zPath)) { $7zPath = "C:\Program Files (x86)\7-Zip\7z.exe" }

if (-not (Test-Path $7zPath)) {
    [System.Windows.Forms.MessageBox]::Show("7-Zip is not installed. Please install it to use this tool.", "Missing 7-Zip", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
    Start-Process "https://www.7-zip.org/download.html"
    exit
}

# --- 2. Build the GUI ---
$form = New-Object System.Windows.Forms.Form
$form.Text = "Large File Zip & Transfer Utility"
$form.Size = New-Object System.Drawing.Size(650, 530)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.Font = New-Object System.Drawing.Font("Segoe UI", 9)

function Add-FolderRow {
    param($form, $yPos, $labelText, $textBoxName)
    $label = New-Object System.Windows.Forms.Label
    $label.Location = New-Object System.Drawing.Point(20, $yPos)
    $label.Size = New-Object System.Drawing.Size(140, 20)
    $label.Text = $labelText
    $form.Controls.Add($label)

    $textBox = New-Object System.Windows.Forms.TextBox
    $textBox.Location = New-Object System.Drawing.Point(160, ($yPos - 3))
    $textBox.Size = New-Object System.Drawing.Size(360, 20)
    $textBox.Name = $textBoxName
    $form.Controls.Add($textBox)

    $button = New-Object System.Windows.Forms.Button
    $button.Location = New-Object System.Drawing.Point(530, ($yPos - 4))
    $button.Size = New-Object System.Drawing.Size(80, 25)
    $button.Text = "Browse..."
    $button.Add_Click({
        $folderBrowser = New-Object System.Windows.Forms.FolderBrowserDialog
        $folderBrowser.Description = "Select $labelText"
        if ($folderBrowser.ShowDialog() -eq 'OK') { $textBox.Text = $folderBrowser.SelectedPath }
    })
    $form.Controls.Add($button)
    return $textBox
}

$y = 30
$lblName = New-Object System.Windows.Forms.Label
$lblName.Location = New-Object System.Drawing.Point(20, $y); $lblName.Size = New-Object System.Drawing.Size(140, 20); $lblName.Text = "1. Archive Base Name:"
$form.Controls.Add($lblName)
$txtBaseName = New-Object System.Windows.Forms.TextBox
$txtBaseName.Location = New-Object System.Drawing.Point(160, ($y - 3)); $txtBaseName.Size = New-Object System.Drawing.Size(450, 20)
$form.Controls.Add($txtBaseName)

$y += 40; $txtSource = Add-FolderRow $form $y "2. Source Folder:" "txtSource"
$y += 40; $txtTemp = Add-FolderRow $form $y "3. Temp Folder:" "txtTemp"
$y += 40; $txtDest = Add-FolderRow $form $y "4. Final Destination:" "txtDest"

$y += 50
$txtLog = New-Object System.Windows.Forms.TextBox
$txtLog.Location = New-Object System.Drawing.Point(20, $y); $txtLog.Size = New-Object System.Drawing.Size(590, 190)
$txtLog.Multiline = $true; $txtLog.ReadOnly = $true; $txtLog.ScrollBars = "Vertical"
$form.Controls.Add($txtLog)

$y += 205
$btnStart = New-Object System.Windows.Forms.Button
$btnStart.Location = New-Object System.Drawing.Point(250, $y); $btnStart.Size = New-Object System.Drawing.Size(130, 35)
$btnStart.Text = "Start Process"; $btnStart.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($btnStart)

# --- 3. Core Logic ---
$btnStart.Add_Click({
    $baseName = $txtBaseName.Text.Trim()
    if (-not $baseName) { [System.Windows.Forms.MessageBox]::Show("Please enter a Base File Name.", "Missing Input", "OK", "Warning"); return }

    $invalidChars = [System.IO.Path]::GetInvalidFileNameChars() -join ''
    if ($baseName -match ("[{0}]" -f [Regex]::Escape($invalidChars))) {
        [System.Windows.Forms.MessageBox]::Show("File name contains invalid characters.", "Invalid Name", "OK", "Warning"); return
    }

    if (-not $txtSource.Text -or -not $txtTemp.Text -or -not $txtDest.Text) {
        [System.Windows.Forms.MessageBox]::Show("Please select all folder paths.", "Missing Input", "OK", "Warning"); return
    }

    $btnStart.Enabled = $false; $form.Cursor = [System.Windows.Forms.Cursors]::WaitCursor; $txtLog.Clear()

    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $jobTempPath = Join-Path $txtTemp.Text "$($baseName)_$timestamp"
    New-Item -ItemType Directory -Path $jobTempPath -Force | Out-Null

    $startTime = Get-Date
    $lastLogUpdate = $startTime
    $txtLog.AppendText("[$(Get-Date -Format T)] Starting process. Temp folder: $jobTempPath`r`n")

    # --- STEP A: Zip and Split ---
    $txtLog.AppendText("[$(Get-Date -Format T)] Zipping and splitting (No compression, 250MB chunks)...`r`n")
    $7zArgs = @("a", "-tzip", "-mx0", "-v250m", "$jobTempPath\$baseName.zip", "$($txtSource.Text)\*")
    $process = Start-Process -FilePath $7zPath -ArgumentList $7zArgs -PassThru -WindowStyle Hidden

    while (-not $process.HasExited) {
        Start-Sleep -Milliseconds 500
        [System.Windows.Forms.Application]::DoEvents()
        if ((Get-Date) -gt $lastLogUpdate.AddSeconds(15)) {
            $elapsed = (Get-Date) - $startTime
            $txtLog.AppendText("[$(Get-Date -Format T)] Still zipping... Elapsed: $($elapsed.ToString('hh\:mm\:ss'))`r`n")
            $lastLogUpdate = Get-Date
        }
    }

    if ($process.ExitCode -ne 0) {
        $txtLog.AppendText("[$(Get-Date -Format T)] ERROR: 7-Zip failed (Code: $($process.ExitCode)).`r`n")
        $form.Cursor = [System.Windows.Forms.Cursors]::Default; $btnStart.Enabled = $true; return
    }
    $txtLog.AppendText("[$(Get-Date -Format T)] Zipping completed.`r`n")

    # --- STEP B: Rename to .001, .002 ---
    Get-ChildItem -Path $jobTempPath -Filter "*.zip.*" | ForEach-Object {
        Rename-Item -Path $_.FullName -NewName ($_.Name -replace '\.zip\.', '.')
    }

    # --- STEP C: Robocopy Transfer ---
    $txtLog.AppendText("[$(Get-Date -Format T)] Starting Robocopy to Final Destination...`r`n")

    # /Z = Restartable mode (crucial for reliability)
    # /J = Unbuffered I/O (crucial for large files to prevent RAM exhaustion)
    # /R:3 /W:5 = Retry 3 times, wait 5 seconds between retries
    # /NP = No progress percentage (keeps log clean)
    $robocopyArgs = @($jobTempPath, $txtDest.Text, "/Z", "/J", "/R:3", "/W:5", "/NP", "/NFL", "/NDL")
    $robocopyProcess = Start-Process -FilePath "robocopy" -ArgumentList $robocopyArgs -PassThru -WindowStyle Hidden

    while (-not $robocopyProcess.HasExited) {
        Start-Sleep -Milliseconds 500
        [System.Windows.Forms.Application]::DoEvents()
        if ((Get-Date) -gt $lastLogUpdate.AddSeconds(15)) {
            $elapsed = (Get-Date) - $startTime
            $txtLog.AppendText("[$(Get-Date -Format T)] Still copying... Elapsed: $($elapsed.ToString('hh\:mm\:ss'))`r`n")
            $lastLogUpdate = Get-Date
        }
    }

    if ($robocopyProcess.ExitCode -ge 8) {
        $txtLog.AppendText("[$(Get-Date -Format T)] ERROR: Robocopy failed (Code: $($robocopyProcess.ExitCode)).`r`n")
        $form.Cursor = [System.Windows.Forms.Cursors]::Default; $btnStart.Enabled = $true; return
    }

    $txtLog.AppendText("[$(Get-Date -Format T)] Transfer completed successfully!`r`n")
    $form.Cursor = [System.Windows.Forms.Cursors]::Default

    # --- STEP D: Cleanup ---
    $result = [System.Windows.Forms.MessageBox]::Show("Process finished!`n`nDelete temporary files in:`n$jobTempPath", "Cleanup", [System.Windows.Forms.MessageBoxButtons]::YesNo, [System.Windows.Forms.MessageBoxIcon]::Question)

    if ($result -eq [System.Windows.Forms.DialogResult]::Yes) {
        Remove-Item -Path $jobTempPath -Recurse -Force
        $txtLog.AppendText("[$(Get-Date -Format T)] Temp files deleted.`r`n")
    } else {
        $txtLog.AppendText("[$(Get-Date -Format T)] Temp files kept.`r`n")
    }

    $btnStart.Enabled = $true
})

$form.Add_Shown({$form.Activate()})
[void]$form.ShowDialog()
