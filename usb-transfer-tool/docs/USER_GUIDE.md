# Auto 49/50 — USB Transfer Tool — Operator Guide

This guide explains day-to-day operation, what happens under the hood, and how
to troubleshoot.

---

## 1. Before you start

1. Install **7-Zip** (<https://www.7-zip.org>).
2. Run `Setup.ps1`:
   - On first launch it checks PowerShell's **execution policy**. If scripts are
     blocked it offers to set **`RemoteSigned` for your account** (no admin
     rights). Click **Yes** once and future launches "just work".
   - Set the **network share** (UNC) and click **Test** — it checks the share is
     reachable *and* writable.
   - Click **Auto-detect** for 7-Zip (or browse to `7z.exe`).
   - Choose your **compression level**, **hashing** (SHA-256/MD5), and defaults.
   - **Save**. This writes `config.json`.

**Execution policy.** These scripts are unsigned. If you'd rather not let Setup
change the policy, either set it once yourself:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

or bypass it per launch (changes nothing permanently):

```powershell
powershell -ExecutionPolicy Bypass -File .\Setup.ps1
powershell -ExecutionPolicy Bypass -File .\Start-Auto4950.ps1
```

If the policy is locked by **Group Policy**, use the Bypass option — Setup
detects this and will tell you.

---

## 2. The main window

```
┌ Header ─────────────────────────────────────────────────────────────┐
│ Title + status            [Rescan Drives] [Settings] [Help]          │
├ System Monitor ─┬ Selection ───────────────┬ Real-time Activity Log ─┤
│ CPU             │ CMS Case Number          │ [09:31:02] ...          │
│ Memory          │ Source drive ▼           │ colour-coded events     │
│ Network Mbps    │ ☑ [Folder] Photos        │                         │
│ Temp free space │ ☑ [File]   report.pdf    │                         │
│ Job progress    │ ...                      │                         │
├─────────────────┴──────────────────────────┴─────────────────────────┤
│ Destination: \\SERVER\...        [Start Capture]  [Cancel]           │
└──────────────────────────────────────────────────────────────────────┘
```

### System Monitor (Task-Manager style)
- **CPU** — average processor load.
- **Memory** — used %, with used/total MB.
- **Network** — live throughput in **Mbps** (delta of adapter byte counters).
- **Temp folder free space** — free/total GB on the staging drive.
- **Job progress** — current stage (hashing / compressing) and percentage.

### Selection panel
- Pick the **source drive** from the dropdown (auto-selected on USB insert).
- The tree lists the drive's top-level **folders** and **files**, each with a
  checkbox. **Everything is ticked by default.** Expand a folder to review its
  contents. Use **Select All** / **Clear** to toggle quickly.
- Selection granularity is **top-level items** — each becomes its own archive so
  transfers can start early. To capture a specific sub-folder only, untick the
  parent and drill into it (or capture the whole folder).

### CMS case number
- Must begin with the configured prefix (default **`CMS-A`**) and include an
  identifier, e.g. `CMS-A12345`. The hint turns highlighted until it's valid.
- This becomes the **destination folder name** and the **archive file name
  prefix**.

---

## 3. Running a capture

1. **Connect the USB drive.** With auto-prompt on, a **Yes/No** dialog appears —
   click **Yes** to proceed (nothing happens until you do).
2. Confirm/adjust the **selection** and enter the **case number**.
3. Click **Start Capture** → confirm the summary dialog.
4. Watch the **activity log** and **job progress**:
   - `STEP` (blue) = stage boundaries, `OK` (green) = success,
     `WARN` (amber), `ERROR` (red).

### What happens internally (per top-level item)
1. **Hash** every original file → manifest (`.txt` human-readable + `.csv`).
2. **Compress** the item with 7-Zip, **embedding the manifest** in the archive.
3. As soon as that archive finishes it is **queued for transfer** to the share
   while the **next item compresses** — this is the pipeline that gives you
   speed.
4. **Transfer** via robocopy (retry/resume) to
   `\\share\<CASE>\<CASE>__<item>.<fmt>`.
5. If **VerifyAfterTransfer** is on, the archive is **re-hashed at the
   destination** and compared (SHA-256).
6. Optionally the **local staged archive is deleted** after success.

A per-case log is also written to
`…\StagingFolder\<CASE>\<CASE>.log`.

### Cancelling
**Cancel** requests a cooperative stop: the current file finishes, then the job
stops. Already-transferred archives remain on the share.

---

## 4. Output layout

```
\\SERVER\Evidence$\
└─ CMS-A12345\
   ├─ CMS-A12345__Photos.7z        ← archive (manifest embedded inside)
   ├─ CMS-A12345__Documents.7z
   └─ CMS-A12345__notes.txt.7z
```

Inside each `.7z`:
```
Photos\...                                (original files)
CMS-A12345__Photos_MANIFEST.txt           (human-readable hashes)
CMS-A12345__Photos_MANIFEST.csv           (machine-readable hashes)
```

Manifest header records: case number, source path, UTC timestamp, machine,
operator, file count and algorithms — a lightweight chain-of-custody record.

---

## 5. Settings reference

Open **Settings** (or re-run `Setup.ps1`). All values persist to `config.json`.

| Setting | Meaning |
|---|---|
| Network share | UNC destination for archives |
| 7-Zip path | Blank = auto-detect |
| Staging folder | Local temp area for archives |
| Case prefix | Required prefix for case numbers (`CMS-A`) |
| Archive format | `7z` (best) or `zip` (portable) |
| Compression level | 0 (store) … 9 (ultra) |
| Archive password | Optional AES-256 (encrypts headers too on `7z`) |
| Hash SHA-256 / MD5 | Which hashes to compute |
| Embed manifest | Include the manifest inside each archive |
| Prompt on insert | Show the Yes/No dialog automatically |
| Select all by default | Pre-tick every folder/file |
| Verify after transfer | Re-hash the archive at the destination |
| Delete local archive | Remove the staged copy after success |
| Exclude patterns | Names to skip (e.g. `System Volume Information`) |

---

## 6. Troubleshooting

| Symptom | Fix |
|---|---|
| "7-Zip not found" | Install 7-Zip or set the path in Settings. |
| "USB auto-detection unavailable" | WMI eventing blocked; use **Rescan Drives** and pick the drive manually. |
| Share "not writable" in Setup | Check the UNC path, permissions, and that you're authenticated to it. |
| Nothing selected | Tick at least one item, or use **Select All**. |
| Case number rejected | It must start with `CMS-A` (or your prefix) and have an identifier. |
| Slow compression | Lower the compression level; level 1–3 is much faster. |
| Verify fails | Re-run; check network stability and destination free space. |
| Script won't run | Launch with `powershell -ExecutionPolicy Bypass -File …`. |

---

## 7. Forensic / integrity notes

- This tool **reads** originals and records hashes; it does **not** write-block
  the source. For evidential work, use a **write blocker**.
- Hashes are computed on the **original** files (pre-compression), so integrity
  can be proven independent of the archive.
- For a full audit trail, keep the per-case `.log` and the manifest `.csv`
  together with the archive.
- Consider signing the manifest and generating a chain-of-custody document —
  see "Recommended next steps" in the README.
