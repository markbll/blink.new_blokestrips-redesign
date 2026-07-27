# Auto 49/50 — USB Compression & Transfer Tool

A Windows PowerShell + WPF application that watches for USB drives, hashes their
contents for chain-of-custody, compresses everything with **7-Zip**, and
transfers the archives to a network share — all tagged with a **CMS case
number**. Compression and transfer run as a **pipeline**, so the first archive
starts uploading while the next is still compressing.

> Designed for evidence/collection style workflows where integrity (SHA-256 /
> MD5) and a clear audit trail matter.

---

## Features

| Requirement | How it's delivered |
|---|---|
| Detect new USB drives | WMI `Win32_VolumeChangeEvent` watcher; the drive is scanned and listed on insert |
| Prompt before acting | Yes/No dialog on insert (`AutoPromptOnInsert`), plus a final confirm |
| Auto-transfer | Tick-box: start automatically on insert, needing only a CMS case, OP name **or** pass number |
| Choose folders/files/drives | Checkbox tree of the drive; **all selected by default**; Select All / Deselect All; drive Refresh |
| CMS / OP / Pass in the name | CMS case (`CMS-A…`), **UPPERCASE** OP name, and operator **pass number** are combined into the folder/archive name |
| Quick Transfer | One button applies the fastest settings (store, single file, **no hashing, no manifest, no verify**) — warns first that integrity is not recorded |
| All options on the main screen | Every setting (incl. **sizing** dropdown) on the on-screen Options panel; **Browse…** pickers for share/staging/7-Zip |
| Compress with 7-Zip | `7z.exe`, level 0–9, `zip` (default) or `7z`, optional AES-256 password |
| Split into multiple files | Split-size **dropdown** (presets or custom MB; default **2 GB**); `0` = single file |
| SHA-256 + MD5 of originals | Per-file manifest (`.txt` + `.csv`), **embedded in the archive** |
| Transfer to a network share | UNC path from config; robocopy with Copy-Item fallback |
| Start transfer early (speed) | Producer/consumer pipeline: transfer begins as soon as the first archive/volume is written |
| Live transfer status | Per-file transfer status + running count on screen |
| Instant cancel + cleanup | Cancel kills 7-Zip/robocopy in ~150 ms and deletes temp files |
| Failed-transfer log | If some files were already sent, a "FAILED TRANSFER" log (names, hashes, times) is written and sent |
| Full-screen GUI | The window opens maximised |
| Real-time events/log | Colour-coded activity log (auto-scrolls) with hashes, file names, dates/times; per-case `.log` file |
| Post-transfer verification | Re-hash the archive at the destination (SHA-256 match) |

---

## Requirements

- **Windows 10/11** (or Windows Server) with **Windows PowerShell 5.1** or **PowerShell 7**.
- **7-Zip** installed — <https://www.7-zip.org>. The tool auto-detects `7z.exe`;
  otherwise set its path in Settings.
- Permission to write to the configured network share.
- A PowerShell **execution policy** that allows local scripts to run (see below).

---

## Execution policy

These scripts are **unsigned**, so Windows' default policy (`Restricted` on
client editions) will block them. You have three options:

1. **Let Setup fix it (recommended).** The first time you run `Setup.ps1`, it
   detects a restrictive policy and offers to set **`RemoteSigned` for your user
   account** — no administrator rights needed, and it only affects you. After
   that you can just right-click the scripts → **Run with PowerShell**.

2. **Set it yourself, once**, in a normal (non-admin) PowerShell window:

   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
   ```

3. **Bypass per launch** (nothing is changed permanently):

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\Setup.ps1
   powershell -ExecutionPolicy Bypass -File .\Start-Auto4950.ps1
   ```

> If your organisation enforces the policy via **Group Policy**, option 1/2
> can't override it — use option 3, or ask an administrator to allow
> `RemoteSigned`. Setup detects this case and tells you.

---

## Quick start

```powershell
# 1. Configure (one time)
powershell -ExecutionPolicy Bypass -File .\Setup.ps1

# 2. Run the tool
powershell -ExecutionPolicy Bypass -File .\Start-Auto4950.ps1
```

Or right-click either `.ps1` and choose **Run with PowerShell**.

1. Connect a USB drive → it is **scanned** and its folders/files are listed.
2. Tick what to capture (all pre-selected); use **Select All** / **Deselect All**.
3. Enter **either** a CMS case (e.g. `CMS-A12345`) **or** an **UPPERCASE** OP name.
4. Click **Start Capture** and confirm — or tick **Auto-transfer** to skip the
   prompts and start automatically whenever a drive is plugged in (it just needs
   a CMS case or OP name to already be filled in).

All options — including **sizing/volume split** — live in the **Options** panel on
the main screen; **Save Options** persists them.

Output on the share (default: `zip` format, split into 2 GB volumes):

```
\\SERVER\Evidence$\CMS-A12345\
    CMS-A12345__Photos.zip.001      (volume 1 – incl. embedded manifest)
    CMS-A12345__Photos.zip.002      (volume 2)
    CMS-A12345__Documents.zip.001
    CMS-A12345__report.pdf.zip.001
```

> When **split** is off (`VolumeSizeMB = 0`) you get single files, e.g.
> `CMS-A12345__Photos.zip`. Reassemble volumes by opening the `.001` file in
> 7-Zip (all parts must be in the same folder).

Each archive embeds `CMS-A12345__<item>_MANIFEST.txt` and `.csv` listing every
original file's size, timestamp and SHA-256 / MD5 hashes.

---

## Files

| File | Purpose |
|---|---|
| `Start-Auto4950.ps1` | Main GUI application (**Auto 49/50**) |
| `Setup.ps1` | First-run / reconfiguration wizard |
| `Modules/Auto4950.Core.psm1` | Config, 7-Zip, hashing, transfer, stats (UI-free) |
| `Modules/Auto4950.Worker.psm1` | Background compress→transfer pipeline |
| `config.json` | Your saved settings (created by Setup) |
| `config.example.json` | Template you can copy to `config.json` |
| `docs/USER_GUIDE.md` | Full operator guide |

---

## Configuration (`config.json`)

See `config.example.json`. Key settings:

- **NetworkShare** — UNC destination, e.g. `\\SERVER\Evidence$`.
- **SevenZipPath** — leave blank to auto-detect.
- **ArchiveFormat** — `zip` (default, portable) or `7z` (smaller, AES-256).
- **VolumeSizeMB** — split archives into volumes of this size in MB
  (default **2048** = 2 GB); `0` = one file. Changeable in Setup **and** Settings.
- **CompressionLevel** — `0` (store, fastest) … `9` (ultra, smallest).
- **HashAlgorithms** — any of `SHA256`, `MD5`.
- **VerifyAfterTransfer** — re-hash the archive at the destination.
- **AutoTransfer** — start automatically on USB insert (needs a CMS case or OP name).
- **StagingFolder** — local temp area for archives before transfer.
- **Password** — optional AES-256 archive password (prefer setting per-session
  in Settings rather than storing in plain text).

---

## Suggested enhancements (implemented / recommended)

**Implemented**
- Post-transfer SHA-256 verification of each archive.
- Embedded + sidecar hash manifest (`.txt` and `.csv`).
- AES-256 archive encryption option.
- robocopy transfer with retry + Copy-Item fallback.
- Per-case operator/machine/timestamp metadata in the manifest.

**Recommended next steps**
- **Write-blocking**: pair with a hardware/software write blocker for true
  forensic soundness (this tool reads originals but does not block writes).
- **Digital signing** of manifests (e.g. sign the `.csv` with a certificate).
- **Central audit log** (append case events to a database or SIEM).
- **Bit-level imaging** option (e.g. capture a raw image with FTK/dd) for cases
  needing a full disk image rather than file-level collection.
- **Chain-of-custody PDF** generated per case.
- **Run as a service / auto-launch** on login for kiosk-style intake stations.

See `docs/USER_GUIDE.md` for operating detail and troubleshooting.
