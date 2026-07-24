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
| Detect new USB drives | WMI `Win32_VolumeChangeEvent` watcher (arrival) |
| Prompt before acting | Yes/No dialog on insert (`AutoPromptOnInsert`), plus a final confirm |
| Choose folders/files/drives | Checkbox tree of the drive; **all selected by default** |
| CMS case number | Enforced `CMS-A…` prefix; used for the folder and archive names |
| Compress with 7-Zip | `7z.exe`, level 0–9, `.7z`/`.zip`, optional AES-256 password |
| SHA-256 + MD5 of originals | Per-file manifest (`.txt` + `.csv`), **embedded in the archive** |
| Transfer to a network share | UNC path from config; robocopy with Copy-Item fallback |
| Start transfer early (speed) | Producer/consumer pipeline: transfer begins after the first archive |
| Settings in a separate file | `config.json` (see `config.example.json`) |
| Task-Manager style stats | Live CPU, memory, network throughput, temp-folder free space |
| Real-time events/log | Colour-coded activity log in the GUI + per-case `.log` file |
| Post-transfer verification | Re-hash the archive at the destination (SHA-256 match) |

---

## Requirements

- **Windows 10/11** (or Windows Server) with **Windows PowerShell 5.1** or **PowerShell 7**.
- **7-Zip** installed — <https://www.7-zip.org>. The tool auto-detects `7z.exe`;
  otherwise set its path in Settings.
- Permission to write to the configured network share.

---

## Quick start

```powershell
# 1. Configure (one time)
powershell -ExecutionPolicy Bypass -File .\Setup.ps1

# 2. Run the tool
powershell -ExecutionPolicy Bypass -File .\Start-BlokeStripsTransfer.ps1
```

Or right-click either `.ps1` and choose **Run with PowerShell**.

1. Connect a USB drive → answer **Yes** to the prompt.
2. Tick the folders/files to capture (everything is pre-selected).
3. Enter a case number, e.g. `CMS-A12345`.
4. Click **Start Capture** and confirm.

Output on the share:

```
\\SERVER\Evidence$\CMS-A12345\
    CMS-A12345__Photos.7z          (archive incl. embedded manifest)
    CMS-A12345__Documents.7z
    CMS-A12345__report.pdf.7z
```

Each archive embeds `CMS-A12345__<item>_MANIFEST.txt` and `.csv` listing every
original file's size, timestamp and SHA-256 / MD5 hashes.

---

## Files

| File | Purpose |
|---|---|
| `Start-BlokeStripsTransfer.ps1` | Main GUI application (**Auto 49/50**) |
| `Setup.ps1` | First-run / reconfiguration wizard |
| `Modules/BlokeStrips.Core.psm1` | Config, 7-Zip, hashing, transfer, stats (UI-free) |
| `Modules/BlokeStrips.Worker.psm1` | Background compress→transfer pipeline |
| `config.json` | Your saved settings (created by Setup) |
| `config.example.json` | Template you can copy to `config.json` |
| `docs/USER_GUIDE.md` | Full operator guide |

---

## Configuration (`config.json`)

See `config.example.json`. Key settings:

- **NetworkShare** — UNC destination, e.g. `\\SERVER\Evidence$`.
- **SevenZipPath** — leave blank to auto-detect.
- **CompressionLevel** — `0` (store, fastest) … `9` (ultra, smallest).
- **HashAlgorithms** — any of `SHA256`, `MD5`.
- **VerifyAfterTransfer** — re-hash the archive at the destination.
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
