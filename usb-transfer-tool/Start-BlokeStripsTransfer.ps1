<#
.SYNOPSIS
    Auto 49/50 - USB Compression & Transfer Tool - main GUI application.

.DESCRIPTION
    Watches for USB drive arrival, prompts the operator, lets them choose which
    folders/files to capture, tags the capture with a CMS case number, then
    hashes (SHA-256 + MD5), compresses (7-Zip) and transfers the archives to a
    configured network share. Compression and transfer run as a pipeline so the
    first archive starts uploading while the next is still compressing.

    The window shows live Task-Manager-style stats (CPU, memory, network speed,
    temp-folder free space) and a real-time activity log.

.NOTES
    Requires: Windows PowerShell 5.1 (or PowerShell 7 on Windows) and 7-Zip.
    Run:      Right-click -> "Run with PowerShell", or:  powershell -ExecutionPolicy Bypass -File .\Start-BlokeStripsTransfer.ps1
#>

[CmdletBinding()]
param()

# ----------------------------------------------------------------------------
# Bootstrapping
# ----------------------------------------------------------------------------
$ErrorActionPreference = 'Stop'
$scriptRoot   = Split-Path -Parent $MyInvocation.MyCommand.Path
$coreModule   = Join-Path $scriptRoot 'Modules\BlokeStrips.Core.psm1'
$workerModule = Join-Path $scriptRoot 'Modules\BlokeStrips.Worker.psm1'

Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase, System.Windows.Forms

Import-Module $coreModule   -Force
Import-Module $workerModule -Force

$config = Import-BsConfig

# Shared state used to talk to the background worker runspace.
$script:Shared = [hashtable]::Synchronized(@{
    Messages     = [System.Collections.Queue]::Synchronized([System.Collections.Queue]::new())
    Cancel       = $false
    Running      = $false
    Config       = $config
    CoreModule   = $coreModule
    WorkerModule = $workerModule
})
$script:PrevStats    = $null
$script:UsbEvents    = [System.Collections.Queue]::Synchronized([System.Collections.Queue]::new())
$script:WorkerPs     = $null
$script:WorkerRs     = $null
$script:WorkerHandle = $null

# ----------------------------------------------------------------------------
# XAML - user interface definition
# ----------------------------------------------------------------------------
[xml]$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Auto 49/50 - USB Compression &amp; Transfer Tool" Height="760" Width="1180"
        WindowStartupLocation="CenterScreen" Background="#FF1E1E24" FontFamily="Segoe UI">
  <Window.Resources>
    <SolidColorBrush x:Key="Panel"  Color="#FF2A2A33"/>
    <SolidColorBrush x:Key="Accent" Color="#FF4FC3F7"/>
    <SolidColorBrush x:Key="Text"   Color="#FFECECEC"/>
    <SolidColorBrush x:Key="Muted"  Color="#FF9AA0A6"/>
    <Style TargetType="TextBlock"><Setter Property="Foreground" Value="{StaticResource Text}"/></Style>
    <Style TargetType="Label"><Setter Property="Foreground" Value="{StaticResource Text}"/></Style>
    <Style x:Key="Card" TargetType="Border">
      <Setter Property="Background" Value="{StaticResource Panel}"/>
      <Setter Property="CornerRadius" Value="8"/>
      <Setter Property="Padding" Value="12"/>
      <Setter Property="Margin" Value="6"/>
    </Style>
    <Style TargetType="Button">
      <Setter Property="Background" Value="#FF3A3A46"/>
      <Setter Property="Foreground" Value="{StaticResource Text}"/>
      <Setter Property="BorderThickness" Value="0"/>
      <Setter Property="Padding" Value="12,7"/>
      <Setter Property="Margin" Value="4"/>
      <Setter Property="Cursor" Value="Hand"/>
      <Setter Property="FontWeight" Value="SemiBold"/>
    </Style>
  </Window.Resources>

  <Grid Margin="8">
    <Grid.RowDefinitions>
      <RowDefinition Height="Auto"/>
      <RowDefinition Height="*"/>
      <RowDefinition Height="Auto"/>
    </Grid.RowDefinitions>

    <!-- Header -->
    <Border Grid.Row="0" Style="{StaticResource Card}">
      <Grid>
        <Grid.ColumnDefinitions>
          <ColumnDefinition Width="*"/>
          <ColumnDefinition Width="Auto"/>
        </Grid.ColumnDefinitions>
        <StackPanel VerticalAlignment="Center">
          <TextBlock FontSize="22" FontWeight="Bold">
            <Run Text="Auto " Foreground="{StaticResource Text}"/><Run Text="49/50" Foreground="{StaticResource Accent}"/>
          </TextBlock>
          <TextBlock x:Name="StatusLine" Text="Idle - waiting for a USB drive to be connected." Foreground="{StaticResource Muted}" Margin="0,2,0,0"/>
        </StackPanel>
        <StackPanel Grid.Column="1" Orientation="Horizontal" VerticalAlignment="Center">
          <Button x:Name="BtnRefresh"  Content="Rescan Drives"/>
          <Button x:Name="BtnSettings" Content="Settings"/>
          <Button x:Name="BtnHelp"     Content="Help"/>
        </StackPanel>
      </Grid>
    </Border>

    <!-- Body -->
    <Grid Grid.Row="1">
      <Grid.ColumnDefinitions>
        <ColumnDefinition Width="300"/>
        <ColumnDefinition Width="1.1*"/>
        <ColumnDefinition Width="1.3*"/>
      </Grid.ColumnDefinitions>

      <!-- Live system stats -->
      <Border Grid.Column="0" Style="{StaticResource Card}">
        <StackPanel>
          <TextBlock Text="SYSTEM MONITOR" FontWeight="Bold" Foreground="{StaticResource Accent}" Margin="0,0,0,8"/>

          <TextBlock Text="CPU"/>
          <ProgressBar x:Name="BarCpu" Height="14" Minimum="0" Maximum="100" Foreground="#FF66BB6A" Background="#FF20202A"/>
          <TextBlock x:Name="LblCpu" Text="0 %" Foreground="{StaticResource Muted}" Margin="0,2,0,10"/>

          <TextBlock Text="Memory"/>
          <ProgressBar x:Name="BarMem" Height="14" Minimum="0" Maximum="100" Foreground="#FFFFA726" Background="#FF20202A"/>
          <TextBlock x:Name="LblMem" Text="0 % (0 / 0 MB)" Foreground="{StaticResource Muted}" Margin="0,2,0,10"/>

          <TextBlock Text="Network Throughput"/>
          <ProgressBar x:Name="BarNet" Height="14" Minimum="0" Maximum="1000" Foreground="{StaticResource Accent}" Background="#FF20202A"/>
          <TextBlock x:Name="LblNet" Text="0 Mbps" Foreground="{StaticResource Muted}" Margin="0,2,0,10"/>

          <TextBlock Text="Temp Folder Free Space"/>
          <ProgressBar x:Name="BarTemp" Height="14" Minimum="0" Maximum="100" Foreground="#FFAB47BC" Background="#FF20202A"/>
          <TextBlock x:Name="LblTemp" Text="0 GB free" Foreground="{StaticResource Muted}" Margin="0,2,0,10"/>

          <Separator Margin="0,6"/>
          <TextBlock Text="Job Progress" FontWeight="Bold" Foreground="{StaticResource Accent}" Margin="0,4,0,4"/>
          <TextBlock x:Name="LblStage" Text="No job running" Foreground="{StaticResource Muted}"/>
          <ProgressBar x:Name="BarJob" Height="16" Minimum="0" Maximum="100" Foreground="#FF66BB6A" Background="#FF20202A" Margin="0,4,0,0"/>
          <TextBlock x:Name="LblJob" Text="" Foreground="{StaticResource Muted}" Margin="0,2,0,0"/>
        </StackPanel>
      </Border>

      <!-- Selection -->
      <Border Grid.Column="1" Style="{StaticResource Card}">
        <Grid>
          <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
          </Grid.RowDefinitions>

          <StackPanel Grid.Row="0">
            <TextBlock Text="CMS CASE NUMBER" FontWeight="Bold" Foreground="{StaticResource Accent}"/>
            <TextBox x:Name="TxtCase" Text="CMS-A" Margin="0,4,0,2" Padding="6" FontSize="14"
                     Background="#FF20202A" Foreground="{StaticResource Text}" BorderBrush="#FF444450"/>
            <TextBlock x:Name="LblCaseHint" Text="Used as the destination folder and archive file names." Foreground="{StaticResource Muted}" FontSize="11"/>
          </StackPanel>

          <StackPanel Grid.Row="1" Orientation="Horizontal" Margin="0,10,0,4">
            <TextBlock Text="Source drive:" VerticalAlignment="Center" Margin="0,0,6,0"/>
            <ComboBox x:Name="CmbDrive" Width="150" Background="#FF20202A" Foreground="#FF202020"/>
            <Button x:Name="BtnSelectAll" Content="Select All"/>
            <Button x:Name="BtnSelectNone" Content="Clear"/>
          </StackPanel>

          <Border Grid.Row="2" Background="#FF20202A" CornerRadius="6" Margin="0,4">
            <TreeView x:Name="TreeItems" Background="Transparent" BorderThickness="0" Foreground="{StaticResource Text}"/>
          </Border>

          <TextBlock Grid.Row="3" x:Name="LblSelCount" Text="0 items selected" Foreground="{StaticResource Muted}" Margin="0,4,0,0"/>
        </Grid>
      </Border>

      <!-- Activity log -->
      <Border Grid.Column="2" Style="{StaticResource Card}">
        <Grid>
          <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
          </Grid.RowDefinitions>
          <TextBlock Grid.Row="0" Text="REAL-TIME ACTIVITY LOG" FontWeight="Bold" Foreground="{StaticResource Accent}" Margin="0,0,0,6"/>
          <Border Grid.Row="1" Background="#FF14141A" CornerRadius="6">
            <RichTextBox x:Name="TxtLog" Background="Transparent" Foreground="#FFD4D4D4" BorderThickness="0"
                         FontFamily="Consolas" FontSize="12" IsReadOnly="True"
                         VerticalScrollBarVisibility="Auto" HorizontalScrollBarVisibility="Auto"/>
          </Border>
        </Grid>
      </Border>
    </Grid>

    <!-- Footer / actions -->
    <Border Grid.Row="2" Style="{StaticResource Card}">
      <Grid>
        <Grid.ColumnDefinitions>
          <ColumnDefinition Width="*"/>
          <ColumnDefinition Width="Auto"/>
        </Grid.ColumnDefinitions>
        <TextBlock x:Name="LblDest" Grid.Column="0" VerticalAlignment="Center" Foreground="{StaticResource Muted}"
                   Text="Destination: (configure in Settings)"/>
        <StackPanel Grid.Column="1" Orientation="Horizontal">
          <Button x:Name="BtnStart"  Content="Start Capture" Background="#FF2E7D32" FontSize="14"/>
          <Button x:Name="BtnCancel" Content="Cancel" Background="#FF8E2A2A" IsEnabled="False"/>
        </StackPanel>
      </Grid>
    </Border>
  </Grid>
</Window>
"@

$reader = New-Object System.Xml.XmlNodeReader $xaml
$window = [Windows.Markup.XamlReader]::Load($reader)

# Grab named controls.
$ctrl = @{}
$xaml.SelectNodes("//*[@*[local-name()='Name']]") | ForEach-Object {
    $name = $_.Attributes['x:Name'].Value
    if ($name) { $ctrl[$name] = $window.FindName($name) }
}

# ----------------------------------------------------------------------------
# Logging helper (writes coloured lines to the RichTextBox)
# ----------------------------------------------------------------------------
function Add-LogLine {
    param([string]$Text, [string]$Level = 'INFO')
    $colour = switch ($Level) {
        'ERROR' { '#FFEF5350' }
        'WARN'  { '#FFFFCA28' }
        'OK'    { '#FF66BB6A' }
        'STEP'  { '#FF4FC3F7' }
        default { '#FFD4D4D4' }
    }
    $ts = Get-Date -Format 'HH:mm:ss'
    $para = New-Object System.Windows.Documents.Paragraph
    $para.Margin = '0'
    $run = New-Object System.Windows.Documents.Run ("[{0}] {1}" -f $ts, $Text)
    $run.Foreground = (New-Object System.Windows.Media.BrushConverter).ConvertFromString($colour)
    $para.Inlines.Add($run)
    $ctrl.TxtLog.Document.Blocks.Add($para)
    $ctrl.TxtLog.ScrollToEnd()
}

# ----------------------------------------------------------------------------
# Drive + tree population
# ----------------------------------------------------------------------------
function Get-RemovableDrives {
    Get-CimInstance Win32_LogicalDisk -Filter "DriveType=2 OR DriveType=3" -ErrorAction SilentlyContinue |
        Where-Object { $_.DeviceID } |
        Sort-Object DeviceID
}

function Update-DriveList {
    param([string]$Prefer)
    $ctrl.CmbDrive.Items.Clear()
    $drives = Get-RemovableDrives
    foreach ($d in $drives) {
        $label = "{0}  {1}" -f $d.DeviceID, ($(if ($d.VolumeName) { $d.VolumeName } else { '(no label)' }))
        [void]$ctrl.CmbDrive.Items.Add($label)
    }
    if ($ctrl.CmbDrive.Items.Count -gt 0) {
        $sel = 0
        if ($Prefer) {
            for ($i = 0; $i -lt $ctrl.CmbDrive.Items.Count; $i++) {
                if ($ctrl.CmbDrive.Items[$i].ToString().StartsWith($Prefer)) { $sel = $i; break }
            }
        }
        $ctrl.CmbDrive.SelectedIndex = $sel
    }
}

function Get-SelectedDriveRoot {
    if ($ctrl.CmbDrive.SelectedItem) {
        return ($ctrl.CmbDrive.SelectedItem.ToString().Split(' ')[0])  # e.g. "E:"
    }
    return $null
}

function New-TreeCheckItem {
    param([string]$FullPath, [string]$Display, [bool]$IsFolder, [bool]$Checked)
    $cb = New-Object System.Windows.Controls.CheckBox
    $cb.Content = $Display
    $cb.IsChecked = $Checked
    $cb.Foreground = $window.FindResource('Text')
    $cb.Tag = @{ Path = $FullPath; IsFolder = $IsFolder }
    $cb.Add_Checked({ Update-SelectionCount })
    $cb.Add_Unchecked({ Update-SelectionCount })
    $tvi = New-Object System.Windows.Controls.TreeViewItem
    $tvi.Header = $cb
    $tvi.Tag = $FullPath
    if ($IsFolder) {
        # Lazy child placeholder so folders can be expanded for review.
        [void]$tvi.Items.Add('...')
        $tvi.Add_Expanded({
            param($s, $e)
            if ($s.Items.Count -eq 1 -and $s.Items[0] -eq '...') {
                $s.Items.Clear()
                try {
                    Get-ChildItem -LiteralPath $s.Tag -Force -ErrorAction SilentlyContinue |
                        Sort-Object { -not $_.PSIsContainer }, Name |
                        Select-Object -First 500 | ForEach-Object {
                            $child = New-Object System.Windows.Controls.TreeViewItem
                            $child.Header = ($(if ($_.PSIsContainer) { '[+] ' } else { '     ' }) + $_.Name)
                            $child.Foreground = $window.FindResource('Muted')
                            [void]$s.Items.Add($child)
                        }
                    if ($s.Items.Count -eq 0) {
                        $empty = New-Object System.Windows.Controls.TreeViewItem
                        $empty.Header = '(empty)'; $empty.Foreground = $window.FindResource('Muted')
                        [void]$s.Items.Add($empty)
                    }
                } catch {}
            }
        })
    }
    return $tvi
}

function Update-TreeForDrive {
    $ctrl.TreeItems.Items.Clear()
    $root = Get-SelectedDriveRoot
    if (-not $root) { return }
    $rootPath = "$root\"
    $checked = [bool]$config.DefaultSelectAll
    try {
        $entries = Get-ChildItem -LiteralPath $rootPath -Force -ErrorAction SilentlyContinue |
            Where-Object { $config.ExcludePatterns -notcontains $_.Name } |
            Sort-Object { -not $_.PSIsContainer }, Name
        foreach ($e in $entries) {
            $display = $(if ($e.PSIsContainer) { "[Folder] $($e.Name)" } else { "[File]   $($e.Name)" })
            [void]$ctrl.TreeItems.Items.Add((New-TreeCheckItem -FullPath $e.FullName -Display $display -IsFolder $e.PSIsContainer -Checked $checked))
        }
    } catch {
        Add-LogLine "Could not read drive $root : $($_.Exception.Message)" 'ERROR'
    }
    Update-SelectionCount
}

function Get-CheckedItems {
    $result = New-Object System.Collections.Generic.List[string]
    foreach ($tvi in $ctrl.TreeItems.Items) {
        $cb = $tvi.Header
        if ($cb -is [System.Windows.Controls.CheckBox] -and $cb.IsChecked) {
            $result.Add($cb.Tag.Path)
        }
    }
    return $result
}

function Update-SelectionCount {
    $n = (Get-CheckedItems).Count
    $ctrl.LblSelCount.Text = "$n item(s) selected"
}

function Set-AllChecks {
    param([bool]$Value)
    foreach ($tvi in $ctrl.TreeItems.Items) {
        if ($tvi.Header -is [System.Windows.Controls.CheckBox]) { $tvi.Header.IsChecked = $Value }
    }
}

# ----------------------------------------------------------------------------
# Settings dialog
# ----------------------------------------------------------------------------
function Show-SettingsDialog {
    [xml]$sx = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Settings" Height="560" Width="620" WindowStartupLocation="CenterOwner"
        Background="#FF2A2A33" FontFamily="Segoe UI">
  <ScrollViewer VerticalScrollBarVisibility="Auto">
  <StackPanel Margin="16">
    <TextBlock Text="Network share (UNC destination)" Foreground="#FFECECEC"/>
    <TextBox x:Name="SNet" Padding="5" Margin="0,2,0,10" Background="#FF20202A" Foreground="#FFECECEC"/>
    <TextBlock Text="7-Zip path (blank = auto-detect)" Foreground="#FFECECEC"/>
    <TextBox x:Name="S7z" Padding="5" Margin="0,2,0,10" Background="#FF20202A" Foreground="#FFECECEC"/>
    <TextBlock Text="Staging folder" Foreground="#FFECECEC"/>
    <TextBox x:Name="SStage" Padding="5" Margin="0,2,0,10" Background="#FF20202A" Foreground="#FFECECEC"/>
    <Grid>
      <Grid.ColumnDefinitions><ColumnDefinition/><ColumnDefinition/></Grid.ColumnDefinitions>
      <StackPanel Grid.Column="0" Margin="0,0,8,0">
        <TextBlock Text="Case prefix" Foreground="#FFECECEC"/>
        <TextBox x:Name="SPrefix" Padding="5" Margin="0,2,0,10" Background="#FF20202A" Foreground="#FFECECEC"/>
        <TextBlock Text="Archive format" Foreground="#FFECECEC"/>
        <ComboBox x:Name="SFormat" Margin="0,2,0,10"><ComboBoxItem>7z</ComboBoxItem><ComboBoxItem>zip</ComboBoxItem></ComboBox>
        <TextBlock Text="Optional archive password (AES-256)" Foreground="#FFECECEC"/>
        <PasswordBox x:Name="SPwd" Padding="5" Margin="0,2,0,10" Background="#FF20202A" Foreground="#FFECECEC"/>
      </StackPanel>
      <StackPanel Grid.Column="1" Margin="8,0,0,0">
        <TextBlock Text="Compression level (0-9)" Foreground="#FFECECEC"/>
        <Slider x:Name="SLevel" Minimum="0" Maximum="9" TickFrequency="1" IsSnapToTickEnabled="True" Margin="0,6,0,4"/>
        <TextBlock x:Name="SLevelLbl" Foreground="#FF9AA0A6" Margin="0,0,0,10"/>
        <CheckBox x:Name="SSha" Content="Hash SHA-256" Foreground="#FFECECEC" Margin="0,2"/>
        <CheckBox x:Name="SMd5" Content="Hash MD5" Foreground="#FFECECEC" Margin="0,2"/>
        <CheckBox x:Name="SEmbed" Content="Embed manifest in archive" Foreground="#FFECECEC" Margin="0,2"/>
      </StackPanel>
    </Grid>
    <CheckBox x:Name="SAuto" Content="Prompt automatically when a USB drive is connected" Foreground="#FFECECEC" Margin="0,4"/>
    <CheckBox x:Name="SAll" Content="Select all folders/files by default" Foreground="#FFECECEC" Margin="0,4"/>
    <CheckBox x:Name="SVerify" Content="Verify archive at destination after transfer (re-hash)" Foreground="#FFECECEC" Margin="0,4"/>
    <CheckBox x:Name="SDelete" Content="Delete local staged archive after successful transfer" Foreground="#FFECECEC" Margin="0,4"/>
    <TextBlock Text="Exclude patterns (comma separated)" Foreground="#FFECECEC" Margin="0,10,0,0"/>
    <TextBox x:Name="SExcl" Padding="5" Margin="0,2,0,10" Background="#FF20202A" Foreground="#FFECECEC"/>
    <StackPanel Orientation="Horizontal" HorizontalAlignment="Right" Margin="0,10,0,0">
      <Button x:Name="SSave" Content="Save" Padding="14,6" Margin="4" Background="#FF2E7D32" Foreground="#FFECECEC"/>
      <Button x:Name="SCancel" Content="Cancel" Padding="14,6" Margin="4" Background="#FF3A3A46" Foreground="#FFECECEC"/>
    </StackPanel>
  </StackPanel>
  </ScrollViewer>
</Window>
"@
    $sr = New-Object System.Xml.XmlNodeReader $sx
    $dlg = [Windows.Markup.XamlReader]::Load($sr)
    $dlg.Owner = $window
    $g = { param($n) $dlg.FindName($n) }

    (& $g 'SNet').Text    = $config.NetworkShare
    (& $g 'S7z').Text     = $config.SevenZipPath
    (& $g 'SStage').Text  = $config.StagingFolder
    (& $g 'SPrefix').Text = $config.CasePrefix
    (& $g 'SLevel').Value = [double]$config.CompressionLevel
    (& $g 'SLevelLbl').Text = "Level $($config.CompressionLevel)"
    (& $g 'SLevel').Add_ValueChanged({ (& $g 'SLevelLbl').Text = "Level $([int](& $g 'SLevel').Value)" })
    (& $g 'SSha').IsChecked    = ($config.HashAlgorithms -contains 'SHA256')
    (& $g 'SMd5').IsChecked    = ($config.HashAlgorithms -contains 'MD5')
    (& $g 'SEmbed').IsChecked  = [bool]$config.EmbedManifest
    (& $g 'SAuto').IsChecked   = [bool]$config.AutoPromptOnInsert
    (& $g 'SAll').IsChecked    = [bool]$config.DefaultSelectAll
    (& $g 'SVerify').IsChecked = [bool]$config.VerifyAfterTransfer
    (& $g 'SDelete').IsChecked = [bool]$config.DeleteLocalArchive
    (& $g 'SExcl').Text        = ($config.ExcludePatterns -join ', ')
    foreach ($it in (& $g 'SFormat').Items) { if ($it.Content -eq $config.ArchiveFormat) { (& $g 'SFormat').SelectedItem = $it } }

    (& $g 'SCancel').Add_Click({ $dlg.DialogResult = $false; $dlg.Close() })
    (& $g 'SSave').Add_Click({
        $config.NetworkShare        = (& $g 'SNet').Text.Trim()
        $config.SevenZipPath        = (& $g 'S7z').Text.Trim()
        $config.StagingFolder       = (& $g 'SStage').Text.Trim()
        $config.CasePrefix          = (& $g 'SPrefix').Text.Trim()
        $config.CompressionLevel    = [int](& $g 'SLevel').Value
        $config.ArchiveFormat       = (& $g 'SFormat').SelectedItem.Content
        $config.Password            = (& $g 'SPwd').Password
        $algs = @(); if ((& $g 'SSha').IsChecked) { $algs += 'SHA256' }; if ((& $g 'SMd5').IsChecked) { $algs += 'MD5' }
        if ($algs.Count -eq 0) { $algs = @('SHA256') }
        $config.HashAlgorithms      = $algs
        $config.EmbedManifest       = [bool](& $g 'SEmbed').IsChecked
        $config.AutoPromptOnInsert  = [bool](& $g 'SAuto').IsChecked
        $config.DefaultSelectAll    = [bool](& $g 'SAll').IsChecked
        $config.VerifyAfterTransfer = [bool](& $g 'SVerify').IsChecked
        $config.DeleteLocalArchive  = [bool](& $g 'SDelete').IsChecked
        $config.ExcludePatterns     = @((& $g 'SExcl').Text.Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ })
        Save-BsConfig -Config $config | Out-Null
        $script:Shared.Config = $config
        $dlg.DialogResult = $true; $dlg.Close()
    })

    if ($dlg.ShowDialog()) {
        Add-LogLine 'Settings saved.' 'OK'
        Update-Footer
        # Keep password out of the on-disk config note.
        if ($config.Password) { Add-LogLine 'Archive password set for this session (not stored in plain config recommended).' 'WARN' }
    }
}

function Update-Footer {
    $sz = Resolve-SevenZip -PreferredPath $config.SevenZipPath
    if (-not $sz) { $sz = 'NOT FOUND' }
    $ctrl.LblDest.Text = "Destination: $($config.NetworkShare)   |   7-Zip: $sz   |   Format: $($config.ArchiveFormat)  Level: $($config.CompressionLevel)  Hash: $($config.HashAlgorithms -join '+')"
}

# ----------------------------------------------------------------------------
# Start / cancel the capture job
# ----------------------------------------------------------------------------
function Start-Capture {
    if ($script:Shared.Running) { return }

    $case = $ctrl.TxtCase.Text.Trim()
    if (-not (Test-BsCaseNumber -CaseNumber $case -Prefix $config.CasePrefix)) {
        [System.Windows.MessageBox]::Show("Case number must start with '$($config.CasePrefix)' and include an identifier, e.g. $($config.CasePrefix)12345.",
            'Invalid case number', 'OK', 'Warning') | Out-Null
        return
    }

    $issues = Test-BsConfig -Config $config
    if ($issues.Count) {
        [System.Windows.MessageBox]::Show(($issues -join "`n"), 'Configuration problems', 'OK', 'Warning') | Out-Null
        return
    }

    $items = Get-CheckedItems
    if ($items.Count -eq 0) {
        [System.Windows.MessageBox]::Show('Select at least one folder or file to capture.', 'Nothing selected', 'OK', 'Warning') | Out-Null
        return
    }

    $confirm = [System.Windows.MessageBox]::Show(
        "Capture $($items.Count) item(s) as case '$case'?`n`nSource : $(Get-SelectedDriveRoot)`nDest   : $(Join-Path $config.NetworkShare (New-BsCaseFolderName $case))`n`nOriginals will be hashed ($($config.HashAlgorithms -join ' + ')), compressed and transferred.",
        'Confirm capture', 'YesNo', 'Question')
    if ($confirm -ne 'Yes') { return }

    # Prepare shared state.
    $script:Shared.Config     = $config
    $script:Shared.CaseNumber = $case
    $script:Shared.DriveRoot  = Get-SelectedDriveRoot
    $script:Shared.Items      = @($items)
    $script:Shared.Cancel     = $false
    $script:Shared.Running    = $true
    $caseSafe = New-BsCaseFolderName $case
    $script:Shared.LogFile    = Join-Path ([Environment]::ExpandEnvironmentVariables($config.StagingFolder)) "$caseSafe\$caseSafe.log"

    # Launch worker runspace.
    $script:WorkerRs = [runspacefactory]::CreateRunspace()
    $script:WorkerRs.ApartmentState = 'MTA'
    $script:WorkerRs.ThreadOptions  = 'ReuseThread'
    $script:WorkerRs.Open()
    $script:WorkerRs.SessionStateProxy.SetVariable('Shared', $script:Shared)
    $script:WorkerPs = [powershell]::Create()
    $script:WorkerPs.Runspace = $script:WorkerRs
    [void]$script:WorkerPs.AddScript({
        param($core, $worker)
        Import-Module $core -Force
        Import-Module $worker -Force
        Invoke-BsTransferJob -Shared $Shared
    }).AddArgument($coreModule).AddArgument($workerModule)
    $script:WorkerHandle = $script:WorkerPs.BeginInvoke()

    $ctrl.BtnStart.IsEnabled  = $false
    $ctrl.BtnCancel.IsEnabled = $true
    $ctrl.StatusLine.Text = "Capturing case $case ..."
    Add-LogLine "Capture started for $case." 'STEP'
}

function Stop-Capture {
    if ($script:Shared.Running) {
        $script:Shared.Cancel = $true
        Add-LogLine 'Cancellation requested...' 'WARN'
    }
}

function Complete-Capture {
    $ctrl.BtnStart.IsEnabled  = $true
    $ctrl.BtnCancel.IsEnabled = $false
    $ctrl.StatusLine.Text = 'Idle - waiting for a USB drive to be connected.'
    if ($script:WorkerPs) {
        try { $script:WorkerPs.EndInvoke($script:WorkerHandle) } catch {}
        $script:WorkerPs.Dispose(); $script:WorkerRs.Dispose()
        $script:WorkerPs = $null; $script:WorkerRs = $null
    }
}

# ----------------------------------------------------------------------------
# Timers: system stats, worker message pump, USB-event pump
# ----------------------------------------------------------------------------
$statsTimer = New-Object System.Windows.Threading.DispatcherTimer
$statsTimer.Interval = [TimeSpan]::FromMilliseconds(1500)
$statsTimer.Add_Tick({
    $stagePath = [Environment]::ExpandEnvironmentVariables($config.StagingFolder)
    $tempQualifier = try { Split-Path -Qualifier $stagePath } catch { $env:SystemDrive }
    if (-not $tempQualifier) { $tempQualifier = $env:SystemDrive }
    $s = Get-BsSystemStats -TempPath "$tempQualifier\" -Previous $script:PrevStats
    if (-not $s) { return }
    $ctrl.BarCpu.Value = $s.CpuPercent;  $ctrl.LblCpu.Text = "$($s.CpuPercent) %"
    $ctrl.BarMem.Value = $s.MemUsedPct;  $ctrl.LblMem.Text = "$($s.MemUsedPct) %  ($([int]$s.MemUsedMB) / $([int]$s.MemTotalMB) MB)"
    $ctrl.BarNet.Maximum = [Math]::Max(100, $s.NetMbps * 1.4)
    $ctrl.BarNet.Value = $s.NetMbps;     $ctrl.LblNet.Text = "$($s.NetMbps) Mbps"
    if ($s.TempTotalGB -gt 0) { $ctrl.BarTemp.Value = 100 * $s.TempFreeGB / $s.TempTotalGB }
    $ctrl.LblTemp.Text = "$($s.TempFreeGB) GB free of $($s.TempTotalGB) GB"
    $script:PrevStats = $s
})

$pumpTimer = New-Object System.Windows.Threading.DispatcherTimer
$pumpTimer.Interval = [TimeSpan]::FromMilliseconds(250)
$pumpTimer.Add_Tick({
    while ($script:Shared.Messages.Count -gt 0) {
        $m = $script:Shared.Messages.Dequeue()
        switch ($m.Type) {
            'log' { Add-LogLine $m.Text $m.Level }
            'progress' {
                switch ($m.Stage) {
                    'item'     { $ctrl.LblStage.Text = "Item $($m.Current)/$($m.Total): $($m.Name)"; $ctrl.BarJob.Value = 0 }
                    'hash'     { $ctrl.LblStage.Text = "Hashing: $($m.Name)"; if ($m.Total) { $ctrl.BarJob.Value = 100 * $m.Current / $m.Total } }
                    'compress' { $ctrl.LblStage.Text = "Compressing: $($m.Name)"; $ctrl.BarJob.Value = $m.Percent; $ctrl.LblJob.Text = "$($m.Percent)%" }
                }
            }
            'done' {
                if ($m.Error) { Add-LogLine "Job ended with error: $($m.Error)" 'ERROR' }
                else { Add-LogLine "Job finished: $($m.Ok) transferred, $($m.Fail) failed. -> $($m.Destination)" ($(if ($m.Fail) {'WARN'} else {'OK'})) }
                $ctrl.LblStage.Text = 'No job running'; $ctrl.BarJob.Value = 0; $ctrl.LblJob.Text = ''
                Complete-Capture
            }
        }
    }
})

$usbTimer = New-Object System.Windows.Threading.DispatcherTimer
$usbTimer.Interval = [TimeSpan]::FromMilliseconds(800)
$usbTimer.Add_Tick({
    while ($script:UsbEvents.Count -gt 0) {
        $drive = $script:UsbEvents.Dequeue()
        Update-DriveList -Prefer $drive
        Update-TreeForDrive
        Add-LogLine "USB drive connected: $drive" 'STEP'
        $ctrl.StatusLine.Text = "USB drive $drive connected."
        if ($config.AutoPromptOnInsert -and -not $script:Shared.Running) {
            $window.Activate()
            $resp = [System.Windows.MessageBox]::Show(
                "A USB drive ($drive) has been connected.`n`nDo you want to capture, hash, compress and transfer its contents now?",
                'USB drive detected', 'YesNo', 'Question')
            if ($resp -eq 'Yes') {
                $ctrl.TxtCase.Focus(); $ctrl.TxtCase.SelectAll()
                Add-LogLine 'Enter a CMS case number and press "Start Capture".' 'INFO'
            }
        }
    }
})

# ----------------------------------------------------------------------------
# USB arrival detection via WMI volume-change events
# ----------------------------------------------------------------------------
$script:UsbSubscription = $null
function Register-UsbWatcher {
    try {
        # EventType 2 = device arrival.
        $query = "SELECT * FROM Win32_VolumeChangeEvent WHERE EventType = 2"
        $script:UsbSubscription = Register-CimIndicationEvent -Query $query -SourceIdentifier 'BsUsbArrival' -MessageData $script:UsbEvents -Action {
            $drive = $Event.SourceEventArgs.NewEvent.DriveName
            if ($drive) { $Event.MessageData.Enqueue($drive) }
        } -ErrorAction Stop
        Add-LogLine 'USB watcher active (monitoring for drive arrival).' 'OK'
    } catch {
        Add-LogLine "USB auto-detection unavailable: $($_.Exception.Message). Use 'Rescan Drives'." 'WARN'
    }
}

# ----------------------------------------------------------------------------
# Help window
# ----------------------------------------------------------------------------
function Show-Help {
    $msg = @"
Auto 49/50 - USB Compression & Transfer Tool

WORKFLOW
  1. Connect a USB drive. If auto-prompt is on you'll be asked to proceed.
  2. Pick the source drive and tick the folders/files to capture (all by default).
  3. Enter a CMS case number (must start with '$($config.CasePrefix)'), e.g. $($config.CasePrefix)12345.
  4. Press "Start Capture". Confirm the Yes/No prompt.

WHAT HAPPENS
  - Every original file is hashed (SHA-256 / MD5) into a manifest.
  - Each top-level item is compressed with 7-Zip; the manifest is embedded.
  - As soon as the first archive is ready it starts transferring to the network
    share while the next item compresses (pipelined for speed).
  - Optionally the transferred archive is re-hashed at the destination to verify.

NAMING
  Destination folder and archive files are named from the case number:
    <share>\$($config.CasePrefix)12345\$($config.CasePrefix)12345__<item>.$($config.ArchiveFormat)

SETTINGS
  Network share, 7-Zip path, compression level, hashing, verification and
  excludes are all in Settings and saved to config.json.

SYSTEM MONITOR
  Live CPU, memory, network throughput and temp-folder free space.

See README.md and docs\USER_GUIDE.md for full documentation.
"@
    [System.Windows.MessageBox]::Show($msg, 'Help', 'OK', 'Information') | Out-Null
}

# ----------------------------------------------------------------------------
# Wire up events
# ----------------------------------------------------------------------------
$ctrl.BtnRefresh.Add_Click({ Update-DriveList; Update-TreeForDrive; Add-LogLine 'Drives rescanned.' 'INFO' })
$ctrl.BtnSettings.Add_Click({ Show-SettingsDialog })
$ctrl.BtnHelp.Add_Click({ Show-Help })
$ctrl.BtnStart.Add_Click({ Start-Capture })
$ctrl.BtnCancel.Add_Click({ Stop-Capture })
$ctrl.BtnSelectAll.Add_Click({ Set-AllChecks $true })
$ctrl.BtnSelectNone.Add_Click({ Set-AllChecks $false })
$ctrl.CmbDrive.Add_SelectionChanged({ Update-TreeForDrive })
$ctrl.TxtCase.Add_TextChanged({
    $ok = Test-BsCaseNumber -CaseNumber $ctrl.TxtCase.Text.Trim() -Prefix $config.CasePrefix
    $ctrl.LblCaseHint.Foreground = $window.FindResource($(if ($ok) { 'Muted' } else { 'Accent' }))
    $ctrl.LblCaseHint.Text = $(if ($ok) { 'Used as the destination folder and archive file names.' }
                              else { "Must start with '$($config.CasePrefix)' and include an identifier." })
})

$window.Add_Loaded({
    Update-DriveList
    Update-TreeForDrive
    Update-Footer
    Register-UsbWatcher
    $statsTimer.Start(); $pumpTimer.Start(); $usbTimer.Start()
    Add-LogLine 'Auto 49/50 ready.' 'OK'
    if (-not (Resolve-SevenZip -PreferredPath $config.SevenZipPath)) {
        Add-LogLine '7-Zip not found. Install it (https://www.7-zip.org) or set the path in Settings.' 'ERROR'
    }
})

$window.Add_Closing({
    $statsTimer.Stop(); $pumpTimer.Stop(); $usbTimer.Stop()
    if ($script:Shared.Running) { $script:Shared.Cancel = $true }
    Get-EventSubscriber -SourceIdentifier 'BsUsbArrival' -ErrorAction SilentlyContinue | Unregister-Event -ErrorAction SilentlyContinue
})

# ----------------------------------------------------------------------------
# Go
# ----------------------------------------------------------------------------
[void]$window.ShowDialog()
