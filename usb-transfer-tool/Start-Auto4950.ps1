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
    Run:      Right-click -> "Run with PowerShell", or:  powershell -ExecutionPolicy Bypass -File .\Start-Auto4950.ps1
#>

[CmdletBinding()]
param()

# ----------------------------------------------------------------------------
# Bootstrapping
# ----------------------------------------------------------------------------
$ErrorActionPreference = 'Stop'
$script:AppVersion = '1.0.0'
$scriptRoot   = Split-Path -Parent $MyInvocation.MyCommand.Path
$coreModule   = Join-Path $scriptRoot 'Modules\Auto4950.Core.psm1'
$workerModule = Join-Path $scriptRoot 'Modules\Auto4950.Worker.psm1'

Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase, System.Windows.Forms

Import-Module $coreModule   -Force
Import-Module $workerModule -Force

$config = Import-A4950Config

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
$script:XferOk       = 0
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
        Title="Auto 49/50 - USB Compression &amp; Transfer Tool" Height="820" Width="1460"
        WindowStartupLocation="CenterScreen" WindowState="Maximized" Background="#FF1E1E24" FontFamily="Segoe UI">
  <Window.Resources>
    <SolidColorBrush x:Key="Panel"  Color="#FF2A2A33"/>
    <SolidColorBrush x:Key="Accent" Color="#FF4FC3F7"/>
    <SolidColorBrush x:Key="Text"   Color="#FFECECEC"/>
    <SolidColorBrush x:Key="Muted"  Color="#FF9AA0A6"/>
    <Style TargetType="TextBlock"><Setter Property="Foreground" Value="{StaticResource Text}"/></Style>
    <Style TargetType="Label"><Setter Property="Foreground" Value="{StaticResource Text}"/></Style>
    <Style TargetType="TextBox">
      <Setter Property="Background" Value="#FF20202A"/>
      <Setter Property="Foreground" Value="{StaticResource Text}"/>
      <Setter Property="BorderBrush" Value="#FF444450"/>
      <Setter Property="Padding" Value="4"/>
      <Setter Property="Margin" Value="0,2,0,8"/>
    </Style>
    <Style TargetType="CheckBox">
      <Setter Property="Foreground" Value="{StaticResource Text}"/>
      <Setter Property="Margin" Value="0,3"/>
    </Style>
    <Style TargetType="ComboBox"><Setter Property="Margin" Value="0,2,0,8"/></Style>
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
          <StackPanel Orientation="Horizontal">
            <TextBlock FontSize="22" FontWeight="Bold">
              <Run Text="Auto " Foreground="{StaticResource Text}"/><Run Text="49/50" Foreground="{StaticResource Accent}"/>
            </TextBlock>
            <TextBlock x:Name="LblVersion" Text="v0.0.0" Foreground="{StaticResource Muted}" FontSize="12" VerticalAlignment="Bottom" Margin="8,0,0,4"/>
          </StackPanel>
          <TextBlock x:Name="StatusLine" Text="Idle - waiting for a USB drive to be connected." Foreground="{StaticResource Muted}" Margin="0,2,0,0"/>
        </StackPanel>
        <StackPanel Grid.Column="1" Orientation="Horizontal" VerticalAlignment="Center">
          <Button x:Name="BtnQuick"    Content="Quick Transfer" Background="#FF7B5BD1"/>
          <Button x:Name="BtnRefresh"  Content="Rescan Drives"/>
          <Button x:Name="BtnHelp"     Content="Help"/>
        </StackPanel>
      </Grid>
    </Border>

    <!-- Body -->
    <Grid Grid.Row="1">
      <Grid.ColumnDefinitions>
        <ColumnDefinition Width="250"/>
        <ColumnDefinition Width="330"/>
        <ColumnDefinition Width="320"/>
        <ColumnDefinition Width="*"/>
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
          <TextBlock x:Name="LblStage" Text="No job running" Foreground="{StaticResource Muted}" TextWrapping="Wrap"/>
          <ProgressBar x:Name="BarJob" Height="16" Minimum="0" Maximum="100" Foreground="#FF66BB6A" Background="#FF20202A" Margin="0,4,0,0"/>
          <TextBlock x:Name="LblJob" Text="" Foreground="{StaticResource Muted}" Margin="0,2,0,0"/>

          <TextBlock Text="Transfer Status" FontWeight="Bold" Foreground="{StaticResource Accent}" Margin="0,10,0,4"/>
          <TextBlock x:Name="LblXfer" Text="Idle" Foreground="{StaticResource Muted}" TextWrapping="Wrap"/>
          <ProgressBar x:Name="BarXfer" Height="12" Foreground="#FF4FC3F7" Background="#FF20202A" Margin="0,4,0,0"/>
          <TextBlock x:Name="LblXferCount" Text="0 file(s) transferred" Foreground="{StaticResource Muted}" Margin="0,2,0,0"/>
        </StackPanel>
      </Border>

      <!-- Transfer details + selection -->
      <Border Grid.Column="1" Style="{StaticResource Card}">
        <Grid>
          <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
          </Grid.RowDefinitions>

          <StackPanel Grid.Row="0">
            <TextBlock Text="CMS CASE NUMBER" FontWeight="Bold" Foreground="{StaticResource Accent}"/>
            <TextBox x:Name="TxtCase" Text="CMS-A" Padding="6" FontSize="14"/>
            <TextBlock x:Name="LblCaseHint" Text="Part of the folder / file name. Must start with the case prefix." Foreground="{StaticResource Muted}" FontSize="11"/>
          </StackPanel>

          <Grid Grid.Row="1" Margin="0,8,0,0">
            <Grid.ColumnDefinitions><ColumnDefinition Width="*"/><ColumnDefinition Width="*"/></Grid.ColumnDefinitions>
            <StackPanel Grid.Column="0" Margin="0,0,6,0">
              <TextBlock Text="OP NAME (UPPERCASE)" FontWeight="Bold" Foreground="{StaticResource Accent}"/>
              <TextBox x:Name="TxtOp" Padding="6" FontSize="14" CharacterCasing="Upper"/>
              <TextBlock x:Name="LblOpHint" Text="UPPERCASE. Optional." Foreground="{StaticResource Muted}" FontSize="11"/>
            </StackPanel>
            <StackPanel Grid.Column="1" Margin="6,0,0,0">
              <TextBlock Text="PASS NUMBER" FontWeight="Bold" Foreground="{StaticResource Accent}"/>
              <TextBox x:Name="TxtPass" Padding="6" FontSize="14"/>
              <TextBlock x:Name="LblPassHint" Text="Operator's pass no. Optional." Foreground="{StaticResource Muted}" FontSize="11"/>
            </StackPanel>
          </Grid>

          <TextBlock Grid.Row="2" x:Name="LblNamePreview" Text="File name: (enter a CMS case, OP name or pass number)"
                     Foreground="{StaticResource Muted}" FontStyle="Italic" Margin="0,6,0,0" TextWrapping="Wrap"/>

          <CheckBox Grid.Row="3" x:Name="ChkAuto" Margin="0,8,0,0"
                    Content="Auto-transfer when a USB drive is plugged in (needs CMS case, OP name or pass no.)"/>

          <StackPanel Grid.Row="4" Orientation="Horizontal" Margin="0,8,0,4">
            <TextBlock Text="Drive:" VerticalAlignment="Center" Margin="0,0,6,0"/>
            <ComboBox x:Name="CmbDrive" Width="100" Foreground="#FF202020" VerticalAlignment="Center"/>
            <Button x:Name="BtnDriveRefresh" Content="Refresh"/>
            <Button x:Name="BtnSelectAll" Content="Select All"/>
            <Button x:Name="BtnSelectNone" Content="Deselect All"/>
          </StackPanel>

          <Border Grid.Row="5" Background="#FF20202A" CornerRadius="6" Margin="0,4">
            <TreeView x:Name="TreeItems" Background="Transparent" BorderThickness="0" Foreground="{StaticResource Text}"/>
          </Border>

          <TextBlock Grid.Row="6" x:Name="LblSelCount" Text="0 items selected" Foreground="{StaticResource Muted}" Margin="0,4,0,0"/>
        </Grid>
      </Border>

      <!-- Options (all settings, on the main screen) -->
      <Border Grid.Column="2" Style="{StaticResource Card}">
        <Grid>
          <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
          </Grid.RowDefinitions>
          <TextBlock Grid.Row="0" Text="OPTIONS" FontWeight="Bold" Foreground="{StaticResource Accent}" Margin="0,0,0,6"/>
          <ScrollViewer Grid.Row="1" VerticalScrollBarVisibility="Auto" Padding="0,0,6,0">
            <StackPanel>
              <TextBlock Text="Network share / destination (UNC or folder)"/>
              <DockPanel>
                <Button x:Name="BtnBrowseNet" Content="Browse..." DockPanel.Dock="Right" Margin="6,2,0,8" Foreground="#FF202020"/>
                <TextBox x:Name="OptNet"/>
              </DockPanel>
              <TextBlock Text="7-Zip path (blank = auto-detect)"/>
              <DockPanel>
                <Button x:Name="BtnBrowse7z" Content="Browse..." DockPanel.Dock="Right" Margin="6,2,0,8" Foreground="#FF202020"/>
                <TextBox x:Name="Opt7z"/>
              </DockPanel>
              <TextBlock Text="Staging folder (local temp)"/>
              <DockPanel>
                <Button x:Name="BtnBrowseStage" Content="Browse..." DockPanel.Dock="Right" Margin="6,2,0,8" Foreground="#FF202020"/>
                <TextBox x:Name="OptStage"/>
              </DockPanel>
              <TextBlock Text="CMS case prefix"/>
              <TextBox x:Name="OptPrefix"/>

              <Separator Margin="0,6"/>
              <TextBlock Text="SIZING / COMPRESSION" FontWeight="Bold" Foreground="{StaticResource Accent}" Margin="0,2,0,4"/>
              <TextBlock Text="Archive format"/>
              <ComboBox x:Name="OptFormat"><ComboBoxItem>zip</ComboBoxItem><ComboBoxItem>7z</ComboBoxItem></ComboBox>
              <TextBlock Text="Split size (per volume)"/>
              <ComboBox x:Name="OptVolume" IsEditable="True">
                <ComboBoxItem>No split (single file)</ComboBoxItem>
                <ComboBoxItem>500</ComboBoxItem>
                <ComboBoxItem>1024</ComboBoxItem>
                <ComboBoxItem>2048</ComboBoxItem>
                <ComboBoxItem>4096</ComboBoxItem>
                <ComboBoxItem>5120</ComboBoxItem>
                <ComboBoxItem>8192</ComboBoxItem>
              </ComboBox>
              <TextBlock Text="(value in MB; type a custom number or pick a preset)" Foreground="{StaticResource Muted}" FontSize="11" Margin="0,0,0,6"/>
              <TextBlock x:Name="OptLevelLbl" Text="Compression level: 5"/>
              <Slider x:Name="OptLevel" Minimum="0" Maximum="9" TickFrequency="1" IsSnapToTickEnabled="True" Margin="0,4,0,8"/>
              <TextBlock Text="Password (AES-256, optional)"/>
              <PasswordBox x:Name="OptPwd" Background="#FF20202A" Foreground="#FFECECEC" BorderBrush="#FF444450" Padding="4" Margin="0,2,0,8"/>

              <Separator Margin="0,6"/>
              <TextBlock Text="HASHING &amp; INTEGRITY" FontWeight="Bold" Foreground="{StaticResource Accent}" Margin="0,2,0,4"/>
              <CheckBox x:Name="OptSha"    Content="Hash SHA-256"/>
              <CheckBox x:Name="OptMd5"    Content="Hash MD5"/>
              <CheckBox x:Name="OptEmbed"  Content="Embed hash manifest in archive"/>
              <CheckBox x:Name="OptVerify" Content="Verify archive at destination"/>

              <Separator Margin="0,6"/>
              <TextBlock Text="BEHAVIOUR" FontWeight="Bold" Foreground="{StaticResource Accent}" Margin="0,2,0,4"/>
              <CheckBox x:Name="OptPrompt"     Content="Prompt on USB insert (when auto-transfer is off)"/>
              <CheckBox x:Name="OptSelDefault" Content="Select all folders/files by default"/>
              <CheckBox x:Name="OptDelete"     Content="Delete local staged archive after transfer"/>
              <TextBlock Text="Exclude patterns (comma separated)"/>
              <TextBox x:Name="OptExcl"/>
            </StackPanel>
          </ScrollViewer>
          <Button Grid.Row="2" x:Name="BtnSaveOptions" Content="Save Options" Background="#FF2E7D32" Margin="0,6,0,0"/>
        </Grid>
      </Border>

      <!-- Activity log -->
      <Border Grid.Column="3" Style="{StaticResource Card}">
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
    # Keep the buffer bounded so long jobs stay responsive.
    while ($ctrl.TxtLog.Document.Blocks.Count -gt 800) {
        $ctrl.TxtLog.Document.Blocks.Remove($ctrl.TxtLog.Document.Blocks.FirstBlock)
    }
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
    if (-not $root) { Update-SelectionCount; return }
    $rootPath = "$root\"
    # Honour the live option controls (so edits take effect without pressing Save).
    $checked = [bool]$config.DefaultSelectAll
    $excl    = @($config.ExcludePatterns)
    if ($ctrl.OptSelDefault) { $checked = [bool]$ctrl.OptSelDefault.IsChecked }
    if ($ctrl.OptExcl)       { $excl = @($ctrl.OptExcl.Text.Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ }) }
    try {
        $entries = Get-ChildItem -LiteralPath $rootPath -Force -ErrorAction SilentlyContinue |
            Where-Object { $excl -notcontains $_.Name } |
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
# Options panel  <->  config  (all settings live on the main screen)
# ----------------------------------------------------------------------------
function Set-OptionsFromConfig {
    $ctrl.OptNet.Text       = $config.NetworkShare
    $ctrl.Opt7z.Text        = $config.SevenZipPath
    $ctrl.OptStage.Text     = $config.StagingFolder
    $ctrl.OptPrefix.Text    = $config.CasePrefix
    $ctrl.OptVolume.Text    = $(if ([int]$config.VolumeSizeMB -le 0) { 'No split (single file)' } else { [string]([int]$config.VolumeSizeMB) })
    $ctrl.OptLevel.Value    = [double]$config.CompressionLevel
    $ctrl.OptLevelLbl.Text  = "Compression level: $([int]$config.CompressionLevel)"
    $ctrl.OptPwd.Password   = [string]$config.Password
    $ctrl.OptSha.IsChecked        = ($config.HashAlgorithms -contains 'SHA256')
    $ctrl.OptMd5.IsChecked        = ($config.HashAlgorithms -contains 'MD5')
    $ctrl.OptEmbed.IsChecked      = [bool]$config.EmbedManifest
    $ctrl.OptVerify.IsChecked     = [bool]$config.VerifyAfterTransfer
    $ctrl.OptDelete.IsChecked     = [bool]$config.DeleteLocalArchive
    $ctrl.OptPrompt.IsChecked     = [bool]$config.AutoPromptOnInsert
    $ctrl.OptSelDefault.IsChecked = [bool]$config.DefaultSelectAll
    $ctrl.ChkAuto.IsChecked       = [bool]$config.AutoTransfer
    $ctrl.OptExcl.Text            = ($config.ExcludePatterns -join ', ')
    foreach ($it in $ctrl.OptFormat.Items) { if ($it.Content -eq $config.ArchiveFormat) { $ctrl.OptFormat.SelectedItem = $it } }
}

function Sync-OptionsToConfig {
    # Gather the on-screen options back into $config (does not persist to disk).
    $config.NetworkShare  = $ctrl.OptNet.Text.Trim()
    $config.SevenZipPath  = $ctrl.Opt7z.Text.Trim()
    $config.StagingFolder = $ctrl.OptStage.Text.Trim()
    if ($ctrl.OptPrefix.Text.Trim()) { $config.CasePrefix = $ctrl.OptPrefix.Text.Trim() }
    if ($ctrl.OptFormat.SelectedItem) { $config.ArchiveFormat = $ctrl.OptFormat.SelectedItem.Content }
    $config.VolumeSizeMB     = Parse-SplitMB ([string]$ctrl.OptVolume.Text)
    $config.CompressionLevel = [int]$ctrl.OptLevel.Value
    $algs = @(); if ($ctrl.OptSha.IsChecked) { $algs += 'SHA256' }; if ($ctrl.OptMd5.IsChecked) { $algs += 'MD5' }
    if ($algs.Count -eq 0) { $algs = @('SHA256') }
    $config.HashAlgorithms      = $algs
    $config.EmbedManifest       = [bool]$ctrl.OptEmbed.IsChecked
    $config.VerifyAfterTransfer = [bool]$ctrl.OptVerify.IsChecked
    $config.DeleteLocalArchive  = [bool]$ctrl.OptDelete.IsChecked
    $config.AutoPromptOnInsert  = [bool]$ctrl.OptPrompt.IsChecked
    $config.DefaultSelectAll    = [bool]$ctrl.OptSelDefault.IsChecked
    $config.AutoTransfer        = [bool]$ctrl.ChkAuto.IsChecked
    $config.ExcludePatterns     = @($ctrl.OptExcl.Text.Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    $config.Password            = $ctrl.OptPwd.Password
    $script:Shared.Config       = $config
}

function Save-Options {
    Sync-OptionsToConfig
    Save-A4950Config -Config $config | Out-Null
    Update-Footer
    Add-LogLine 'Options saved to config.json.' 'OK'
    if ($config.Password) { Add-LogLine 'Archive password set (avoid storing sensitive passwords in plain config).' 'WARN' }
}

# ----------------------------------------------------------------------------
# Windows folder/file pickers for locations
# ----------------------------------------------------------------------------
function Select-Folder {
    param([string]$Description, [string]$Start)
    $dlg = New-Object System.Windows.Forms.FolderBrowserDialog
    $dlg.Description = $Description
    $dlg.ShowNewFolderButton = $true
    if ($Start -and (Test-Path -LiteralPath $Start)) { $dlg.SelectedPath = $Start }
    if ($dlg.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { return $dlg.SelectedPath }
    return $null
}

function Select-SevenZipFile {
    $dlg = New-Object System.Windows.Forms.OpenFileDialog
    $dlg.Title  = 'Locate 7z.exe'
    $dlg.Filter = '7-Zip executable (7z.exe;7za.exe)|7z.exe;7za.exe|Executables (*.exe)|*.exe'
    foreach ($seed in @("$env:ProgramW6432\7-Zip", "$env:ProgramFiles\7-Zip", "${env:ProgramFiles(x86)}\7-Zip")) {
        if ($seed -and (Test-Path -LiteralPath $seed)) { $dlg.InitialDirectory = $seed; break }
    }
    if ($dlg.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { return $dlg.FileName }
    return $null
}

# ----------------------------------------------------------------------------
# Quick Transfer: apply the fastest settings
# ----------------------------------------------------------------------------
function Set-QuickTransfer {
    # Warn first: Quick Transfer trades integrity for raw speed.
    $warn = [System.Windows.MessageBox]::Show(
        "QUICK TRANSFER - fastest settings`n`n" +
        "This applies the quickest possible transfer:`n" +
        "  - Store (NO compression)`n" +
        "  - Single file (NO splitting)`n" +
        "  - NO hashing  (SHA-256 / MD5 will NOT be calculated)`n" +
        "  - NO manifest`n" +
        "  - NO verification at the destination`n`n" +
        "File integrity will NOT be recorded or verified. Use this only when speed " +
        "matters more than a hash record.`n`nApply Quick Transfer settings?",
        'Quick Transfer - integrity disabled', 'YesNo', 'Warning')
    if ($warn -ne 'Yes') { Add-LogLine 'Quick Transfer cancelled - settings unchanged.' 'INFO'; return }

    # Fastest: store (no compression), single file, no hashing, no manifest, no verify.
    foreach ($it in $ctrl.OptFormat.Items) { if ($it.Content -eq 'zip') { $ctrl.OptFormat.SelectedItem = $it } }
    $ctrl.OptLevel.Value = 0
    $ctrl.OptLevelLbl.Text = 'Compression level: 0'
    $ctrl.OptVolume.Text = 'No split (single file)'
    $ctrl.OptSha.IsChecked    = $false
    $ctrl.OptMd5.IsChecked    = $false
    $ctrl.OptEmbed.IsChecked  = $false   # no manifest -> originals are not hashed
    $ctrl.OptVerify.IsChecked = $false   # no re-hash at destination
    $ctrl.OptDelete.IsChecked = $false
    Sync-OptionsToConfig
    Update-Footer
    Add-LogLine 'Quick Transfer ON: store (no compression), single file, NO hashing, NO verify - fastest throughput.' 'WARN'
}

# ----------------------------------------------------------------------------
# Transfer identifier: any of CMS case (validated) / OP name (UPPERCASE) / Pass no.
# The folder + archive names are built from whichever are supplied, joined by '_'.
# ----------------------------------------------------------------------------
function Get-TransferName {
    $case = $ctrl.TxtCase.Text.Trim()
    $op   = $ctrl.TxtOp.Text.Trim()
    $pass = $ctrl.TxtPass.Text.Trim()
    $caseGiven = $case -and ($case -ne $config.CasePrefix)

    $parts = @(); $kinds = @(); $errs = @()
    if ($caseGiven) {
        if (Test-A4950CaseNumber -CaseNumber $case -Prefix $config.CasePrefix) { $parts += $case; $kinds += 'CMS' }
        else { $errs += "CMS case must start with '$($config.CasePrefix)' and include an identifier." }
    }
    if ($op) {
        if (Test-A4950OpName -Name $op) { $parts += $op; $kinds += 'OP' }
        else { $errs += 'OP name must be UPPERCASE.' }
    }
    if ($pass) {
        $parts += ('PASS' + (New-A4950CaseFolderName -CaseNumber $pass)); $kinds += 'PASS'
    }

    if ($errs.Count) { return [pscustomobject]@{ Ok = $false; Name = $null; Kind = ''; Reason = ($errs -join ' ') } }
    if ($parts.Count -eq 0) {
        return [pscustomobject]@{ Ok = $false; Name = $null; Kind = ''; Reason = "Enter a CMS case (e.g. $($config.CasePrefix)12345), an OP name (UPPERCASE) or a pass number." }
    }
    return [pscustomobject]@{ Ok = $true; Name = ($parts -join '_'); Kind = ($kinds -join '+'); Reason = '' }
}

function Update-NamePreview {
    $tn = Get-TransferName
    if ($tn.Ok) {
        $ctrl.LblNamePreview.Foreground = $window.FindResource('Muted')
        $ctrl.LblNamePreview.Text = "File name: $($tn.Name)__<folder>.$($config.ArchiveFormat)"
    } else {
        $ctrl.LblNamePreview.Foreground = $window.FindResource('Accent')
        $ctrl.LblNamePreview.Text = "File name: $($tn.Reason)"
    }
}

function Parse-SplitMB {
    param([string]$Text)
    if (-not $Text) { return 0 }
    if ($Text -match '(?i)no\s*split') { return 0 }
    if ($Text -match '(\d+)') { return [int]$Matches[1] }
    return 0
}

function Update-Footer {
    $sz = Resolve-SevenZip -PreferredPath $config.SevenZipPath
    if (-not $sz) { $sz = 'NOT FOUND' }
    $split = if ([int]$config.VolumeSizeMB -gt 0) { "Split: $([int]$config.VolumeSizeMB) MB" } else { 'Split: off' }
    $auto  = if ($config.AutoTransfer) { 'Auto: ON' } else { 'Auto: off' }
    $hash  = if ($config.EmbedManifest) { "Hash:$($config.HashAlgorithms -join '+')" } else { 'Hash:OFF' }
    $vfy   = if ($config.VerifyAfterTransfer) { 'Verify:on' } else { 'Verify:off' }
    $ctrl.LblDest.Text = "Dest: $($config.NetworkShare)   |   7-Zip: $sz   |   $($config.ArchiveFormat)  L$($config.CompressionLevel)  $split  $hash  $vfy   |   $auto"
}

# ----------------------------------------------------------------------------
# Start / cancel the capture job
# ----------------------------------------------------------------------------
function Start-Capture {
    param([switch]$NoConfirm)
    if ($script:Shared.Running) { return }

    # Apply the on-screen options first so the capture uses current settings.
    Sync-OptionsToConfig

    $tn = Get-TransferName
    if (-not $tn.Ok) {
        [System.Windows.MessageBox]::Show($tn.Reason, 'Identifier required', 'OK', 'Warning') | Out-Null
        return
    }
    $name = $tn.Name

    $issues = Test-A4950Config -Config $config
    if ($issues.Count) {
        [System.Windows.MessageBox]::Show(($issues -join "`n"), 'Configuration problems', 'OK', 'Warning') | Out-Null
        return
    }

    $items = Get-CheckedItems
    if ($items.Count -eq 0) {
        [System.Windows.MessageBox]::Show('Select at least one folder or file to capture.', 'Nothing selected', 'OK', 'Warning') | Out-Null
        return
    }

    $caseSafe = New-A4950CaseFolderName $name

    if (-not $NoConfirm) {
        # List the top-level folders/files, the destination folder and the zip names.
        $fmt = $config.ArchiveFormat
        $splitSuffix = if ([int]$config.VolumeSizeMB -gt 0) { ".001, .002, ..." } else { '' }
        $lines = foreach ($it in $items) {
            $leaf = Split-Path -Leaf ($it.TrimEnd('\','/'))
            if (-not $leaf) { $leaf = 'root' }
            "   - $leaf   ->   ${caseSafe}__$leaf.$fmt$splitSuffix"
        }
        $maxShow = 20
        $shown = @($lines | Select-Object -First $maxShow)
        if ($items.Count -gt $maxShow) { $shown += "   ... and $($items.Count - $maxShow) more" }
        $destPath = Join-Path $config.NetworkShare $caseSafe
        $integrity = if ($config.EmbedManifest) {
            "Originals will be hashed ($($config.HashAlgorithms -join ' + '))" +
            $(if ($config.VerifyAfterTransfer) { ' and verified at the destination' } else { ' (no destination verify)' }) + '.'
        } else {
            "WARNING: Quick Transfer - NO hashing and NO verification. File integrity will not be recorded."
        }
        $msg = @"
Capture $($items.Count) top-level item(s) as '$name' ($($tn.Kind))?

Source drive : $(Get-SelectedDriveRoot)
Destination  : $destPath

Selected folders/files  ->  archive name:
$($shown -join "`n")

$integrity
"@
        $confirm = [System.Windows.MessageBox]::Show($msg, 'Confirm capture', 'YesNo', 'Question')
        if ($confirm -ne 'Yes') { return }
    }

    # Reset transfer status UI.
    $ctrl.LblXfer.Text = 'Starting...'; $ctrl.LblXferCount.Text = '0 file(s) transferred'
    $ctrl.BarXfer.IsIndeterminate = $false; $ctrl.BarXfer.Value = 0
    $script:XferOk = 0

    # Prepare shared state.
    $script:Shared.Config     = $config
    $script:Shared.CaseNumber = $name
    $script:Shared.DriveRoot  = Get-SelectedDriveRoot
    $script:Shared.Items      = @($items)
    $script:Shared.Cancel     = $false
    $script:Shared.Running    = $true
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
        Invoke-A4950TransferJob -Shared $Shared
    }).AddArgument($coreModule).AddArgument($workerModule)
    $script:WorkerHandle = $script:WorkerPs.BeginInvoke()

    $ctrl.BtnStart.IsEnabled  = $false
    $ctrl.BtnCancel.IsEnabled = $true
    $ctrl.StatusLine.Text = "Capturing $name ($($tn.Kind)) ..."
    Add-LogLine "Capture started for $name ($($tn.Kind))." 'STEP'
}

function Stop-Capture {
    if ($script:Shared.Running) {
        $script:Shared.Cancel = $true      # worker kills 7-Zip/robocopy within ~150 ms
        $ctrl.BtnCancel.IsEnabled = $false
        $ctrl.StatusLine.Text = 'Cancelling - stopping processes and cleaning up temp...'
        $ctrl.LblXfer.Text = 'Cancelling...'
        $ctrl.BarXfer.IsIndeterminate = $false
        Add-LogLine 'Cancel requested - killing active 7-Zip/robocopy and cleaning temp files...' 'WARN'
    }
}

function Complete-Capture {
    $ctrl.BtnStart.IsEnabled  = $true
    $ctrl.BtnCancel.IsEnabled = $false
    $ctrl.StatusLine.Text = 'Idle - waiting for a USB drive to be connected.'
    $ctrl.BarXfer.IsIndeterminate = $false
    if ($ctrl.LblXfer.Text -notmatch 'complete|cancel') { $ctrl.LblXfer.Text = 'Idle' }
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
    $s = Get-A4950SystemStats -TempPath "$tempQualifier\" -Previous $script:PrevStats
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
                    'item'     { $ctrl.LblStage.Text = "Item $($m.Current)/$($m.Total): $($m.Name)"; $ctrl.BarJob.IsIndeterminate = $false; $ctrl.BarJob.Value = 0; $ctrl.LblJob.Text = '' }
                    'hash'     { $ctrl.LblStage.Text = "Hashing: $($m.Name)"; $ctrl.BarJob.IsIndeterminate = $false; if ($m.Total) { $ctrl.BarJob.Value = 100 * $m.Current / $m.Total } }
                    'compress' {
                        $ctrl.LblStage.Text = "Compressing: $($m.Name)"
                        if ([int]$m.Percent -lt 0) { $ctrl.BarJob.IsIndeterminate = $true; $ctrl.LblJob.Text = 'working...' }
                        else { $ctrl.BarJob.IsIndeterminate = $false; $ctrl.BarJob.Value = $m.Percent; $ctrl.LblJob.Text = "$($m.Percent)%" }
                    }
                    'xfer' {
                        if ($m.Action -eq 'start') {
                            $ctrl.LblXfer.Text = "Transferring: $($m.Name)"
                            $ctrl.BarXfer.IsIndeterminate = $true
                        } else {
                            $ctrl.BarXfer.IsIndeterminate = $false; $ctrl.BarXfer.Value = 0
                            if ($m.Ok) {
                                $script:XferOk = [int]$script:XferOk + 1
                                $ctrl.LblXfer.Text = "Transferred: $($m.Name)"
                                $ctrl.LblXferCount.Text = "$($script:XferOk) file(s) transferred"
                            } else {
                                $ctrl.LblXfer.Text = "Transfer stopped: $($m.Name)"
                            }
                        }
                    }
                }
            }
            'done' {
                if ($m.Error) { Add-LogLine "Job ended with error: $($m.Error)" 'ERROR' }
                elseif ($m.Cancelled) { Add-LogLine "Cancelled: $($m.Ok) file(s) transferred before stopping; temp cleaned up." 'WARN'; $ctrl.LblXfer.Text = "Cancelled ($($m.Ok) transferred)" }
                else { Add-LogLine "Job finished: $($m.Ok) transferred, $($m.Fail) failed. -> $($m.Destination)" ($(if ($m.Fail) {'WARN'} else {'OK'})); $ctrl.LblXfer.Text = "Complete ($($m.Ok) transferred)" }
                $ctrl.LblStage.Text = 'No job running'; $ctrl.BarJob.IsIndeterminate = $false; $ctrl.BarJob.Value = 0; $ctrl.LblJob.Text = ''
                $ctrl.BarXfer.IsIndeterminate = $false; $ctrl.BarXfer.Value = 0
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
        # Scan the new drive and list its folders/files for selection.
        Update-DriveList -Prefer $drive
        Update-TreeForDrive
        $n = (Get-CheckedItems).Count
        Add-LogLine "USB drive connected: $drive - scanned, $n item(s) listed." 'STEP'
        $ctrl.StatusLine.Text = "USB drive $drive connected and scanned."
        if ($script:Shared.Running) { continue }

        if ($ctrl.ChkAuto.IsChecked) {
            # Auto-transfer: only needs a valid CMS case OR OP name.
            $tn = Get-TransferName
            if ($tn.Ok) {
                Add-LogLine "Auto-transfer: starting '$($tn.Name)' ($($tn.Kind)) from $drive." 'STEP'
                Start-Capture -NoConfirm
            } else {
                $window.Activate()
                Add-LogLine "Auto-transfer is ON but needs an identifier. $($tn.Reason)" 'WARN'
                [System.Windows.MessageBox]::Show(
                    "USB drive $drive connected and scanned.`n`nAuto-transfer is ON but needs a CMS case or OP name.`n`n$($tn.Reason)",
                    'Auto-transfer - identifier needed', 'OK', 'Warning') | Out-Null
                if ($ctrl.TxtCase.Text.Trim() -eq $config.CasePrefix -or -not $ctrl.TxtCase.Text.Trim()) { $ctrl.TxtCase.Focus(); $ctrl.TxtCase.SelectAll() }
            }
        }
        elseif ($ctrl.OptPrompt.IsChecked) {
            $window.Activate()
            $resp = [System.Windows.MessageBox]::Show(
                "A USB drive ($drive) has been connected and scanned.`n`nReview the folders/files in the middle panel and choose what to transfer.`n`nEnter a CMS case or OP name and start now?",
                'USB drive detected', 'YesNo', 'Question')
            if ($resp -eq 'Yes') {
                $ctrl.TxtCase.Focus(); $ctrl.TxtCase.SelectAll()
                Add-LogLine 'Select folders/files, enter a CMS case or OP name, then press "Start Capture".' 'INFO'
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
        $script:UsbSubscription = Register-CimIndicationEvent -Query $query -SourceIdentifier 'Auto4950UsbArrival' -MessageData $script:UsbEvents -Action {
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
Auto 49/50  (version $script:AppVersion) - USB Compression & Transfer Tool

WORKFLOW
  1. Connect a USB drive. It is scanned automatically and its folders/files are
     listed in the middle panel. Tick what to transfer (all by default); use
     "Select All" / "Deselect All" or untick individual items.
  2. Fill in any of: CMS case (starts with '$($config.CasePrefix)'), OP NAME (UPPERCASE),
     PASS NUMBER. Whatever you provide is combined into the folder/file name
     (e.g. $($config.CasePrefix)12345_JBLOGGS_PASS4471). At least one is required.
  3. Press "Start Capture" and confirm the summary (which lists the folders, the
     destination and the zip names).

QUICK TRANSFER
  The "Quick Transfer" button applies the fastest possible settings: store (no
  compression), single file (no splitting), NO hashing (SHA-256/MD5 are not
  calculated), no manifest and no verification. It warns you first, because file
  integrity is neither recorded nor verified in this mode. Use it only when raw
  transfer speed matters more than a hash record.

CANCEL
  "Cancel" is immediate: it kills the running 7-Zip/robocopy within a fraction
  of a second and deletes the temp files. Any archives already copied stay on
  the share, and a "FAILED TRANSFER" log listing them (with hashes and times)
  is written and sent to the destination.

AUTO-TRANSFER
  Tick "Auto-transfer when a USB drive is plugged in". Then, as soon as a drive
  is connected, the capture starts automatically with NO prompts - it only
  requires that a valid CMS case, OP name or pass number is already entered.
  If none is set you'll be asked to provide one.

OPTIONS (all on the main screen, right-hand panel)
  Network share, 7-Zip path, staging folder, case prefix, archive format,
  volume/split size, compression level, password, hashing, manifest embedding,
  verification, prompt-on-insert, select-all default, delete-local and exclude
  patterns. Every option can be toggled/edited and "Save Options" persists them
  to config.json. Options also apply immediately when you press Start.

WHAT HAPPENS
  - Every original file is hashed (SHA-256 / MD5) into a manifest.
  - Each top-level item is compressed with 7-Zip; the manifest is embedded.
  - Large archives are split into volumes ($([int]$config.VolumeSizeMB) MB each by default) so no
    single file is unwieldy. Set the size to 0 for one file per item.
  - As soon as the first archive/volume is ready it starts transferring to the
    network share while the next item compresses (pipelined for speed).
  - Optionally the transferred archive is re-hashed at the destination to verify.

NAMING
  Destination folder and archive files are named from the CMS case or OP name:
    <share>\$($config.CasePrefix)12345\$($config.CasePrefix)12345__<item>.$($config.ArchiveFormat)
  When split, volumes are suffixed .001, .002, ... (open the .001 in 7-Zip to
  reassemble; keep all parts together).

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
$ctrl.BtnDriveRefresh.Add_Click({ Update-DriveList; Update-TreeForDrive; Add-LogLine 'Drives refreshed.' 'INFO' })
$ctrl.BtnHelp.Add_Click({ Show-Help })
$ctrl.BtnQuick.Add_Click({ Set-QuickTransfer })
$ctrl.BtnStart.Add_Click({ Start-Capture })
$ctrl.BtnCancel.Add_Click({ Stop-Capture })
$ctrl.BtnSelectAll.Add_Click({ Set-AllChecks $true })
$ctrl.BtnSelectNone.Add_Click({ Set-AllChecks $false })
$ctrl.BtnSaveOptions.Add_Click({ Save-Options })
$ctrl.BtnBrowseNet.Add_Click({ $p = Select-Folder 'Select the destination / network share folder' $ctrl.OptNet.Text; if ($p) { $ctrl.OptNet.Text = $p } })
$ctrl.BtnBrowseStage.Add_Click({ $p = Select-Folder 'Select the local staging folder' ([Environment]::ExpandEnvironmentVariables($ctrl.OptStage.Text)); if ($p) { $ctrl.OptStage.Text = $p } })
$ctrl.BtnBrowse7z.Add_Click({ $p = Select-SevenZipFile; if ($p) { $ctrl.Opt7z.Text = $p } })
$ctrl.OptLevel.Add_ValueChanged({ $ctrl.OptLevelLbl.Text = "Compression level: $([int]$ctrl.OptLevel.Value)" })
$ctrl.OptFormat.Add_SelectionChanged({ if ($ctrl.OptFormat.SelectedItem) { $config.ArchiveFormat = $ctrl.OptFormat.SelectedItem.Content; Update-NamePreview } })
$ctrl.CmbDrive.Add_SelectionChanged({ Update-TreeForDrive })
$ctrl.TxtCase.Add_TextChanged({
    $t = $ctrl.TxtCase.Text.Trim()
    $blank = (-not $t) -or ($t -eq $config.CasePrefix)
    $ok = $blank -or (Test-A4950CaseNumber -CaseNumber $t -Prefix $config.CasePrefix)
    $ctrl.LblCaseHint.Foreground = $window.FindResource($(if ($ok) { 'Muted' } else { 'Accent' }))
    $ctrl.LblCaseHint.Text = $(if ($ok) { 'Part of the folder / file name. Must start with the case prefix.' }
                              else { "Must start with '$($config.CasePrefix)' and include an identifier." })
    Update-NamePreview
})
$ctrl.TxtOp.Add_TextChanged({
    $t = $ctrl.TxtOp.Text.Trim()
    $ok = (-not $t) -or (Test-A4950OpName -Name $t)
    $ctrl.LblOpHint.Foreground = $window.FindResource($(if ($ok) { 'Muted' } else { 'Accent' }))
    $ctrl.LblOpHint.Text = $(if ($ok) { 'UPPERCASE. Optional.' } else { 'Must be UPPERCASE.' })
    Update-NamePreview
})
$ctrl.TxtPass.Add_TextChanged({ Update-NamePreview })

$window.Add_Loaded({
    $ctrl.LblVersion.Text = "v$script:AppVersion"
    $window.Title = "Auto 49/50 v$script:AppVersion - USB Compression & Transfer Tool"
    Set-OptionsFromConfig
    Update-DriveList
    Update-TreeForDrive
    Update-Footer
    Update-NamePreview
    Register-UsbWatcher
    $statsTimer.Start(); $pumpTimer.Start(); $usbTimer.Start()
    Add-LogLine "Auto 49/50 v$script:AppVersion ready." 'OK'
    if (-not (Resolve-SevenZip -PreferredPath $config.SevenZipPath)) {
        Add-LogLine '7-Zip not found. Install it (https://www.7-zip.org) or set the 7-Zip path in Options.' 'ERROR'
    }
})

$window.Add_Closing({
    $statsTimer.Stop(); $pumpTimer.Stop(); $usbTimer.Stop()
    if ($script:Shared.Running) { $script:Shared.Cancel = $true }
    Get-EventSubscriber -SourceIdentifier 'Auto4950UsbArrival' -ErrorAction SilentlyContinue | Unregister-Event -ErrorAction SilentlyContinue
})

# ----------------------------------------------------------------------------
# Go
# ----------------------------------------------------------------------------
[void]$window.ShowDialog()
