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
┌ Header ───────────────────────────────────────────────────────────────────────────┐
│ Auto 49/50 + status      [Quick Transfer] [Rescan Drives] [Hide Options] [Help]     │
├ System Monitor (compact horizontal strip: CPU · Memory · Network · Temp free · Job │
│ progress · Transfer status) ────────────────────────────────────────────────────────┤
├ Details + Selection ──┬ Options ───────────┬ File Activity ─────────────────────────┤
│ CMS Case Number       │ Destination         │ Destination folder activity            │
│ OP Name (UPPERCASE)   │ Format / Split size │  [09:31:02] Created: CASE.zip.001      │
│ ☑ Auto-transfer       │ Level / Hashing     │ Temp folder activity                   │
│ Drive ▼ [Sel][Desel]  │ ...all options...   │  [09:30:58] Created: CASE.zip.001      │
│ [Add Folder(s)][Files]│ [ Save Options ]    │                                         │
│ ☑ Photos  ☑ report    │                     │                                         │
│ Added sources: (list) │                     │                                         │
├───────────────────────┴─────────────────────┴─────────────────────────────────────────┤
│ Real-Time Activity Log (full width, ≥10 lines) — [09:31:02] ... colour-coded events   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Destination: C:\Destination...        [Start Transfer]  [Cancel]                       │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

Click **Hide Options** to collapse the Options column and give the other
panels more room (click **Show Options** to bring it back — nothing you've
set is lost either way).

### System Monitor (compact strip across the top)
- **CPU** — average processor load.
- **Memory** — used %, with used/total MB.
- **Network** — live throughput in **Mbps** (delta of adapter byte counters).
- **Temp Free Space** — free/total GB on the temp-folder drive.
- **Job Progress** — current stage (hashing / compressing) and percentage.
- **Transfer Status** — current file being transferred and a running count.

### File Activity panels
Two live lists sit alongside the Options panel: one shows files as they are
created in the **destination** folder, the other shows files as they are
created in the local **temp** folder — so you can watch archives land and get
cleaned up in real time, independent of the main activity log.

### Keep awake
While a transfer is running, the tool prevents Windows from sleeping or
turning off the display (`SetThreadExecutionState`), so a long transfer isn't
interrupted by the machine going to sleep. This is released automatically
once the job finishes or is cancelled. It does **not** override a manual
Win+L lock or a lock screen enforced by Group Policy.

### Selection panel
- On insert the drive is **scanned automatically**; you don't have to ask for it.
- Pick the **source drive** from the dropdown (auto-selected on USB insert).
- The tree lists the drive's top-level **folders** and **files**, each with a
  checkbox. **Everything is ticked by default.** Expand a folder to review its
  contents. Use **Select All** / **Deselect All**, or untick individual items —
  every selection can be de-selected.
- Selection granularity is **top-level items** (or specific sub-folders/files
  within them). Everything you tick is combined into **one** archive for the
  job — to transfer a specific sub-folder only, untick the parent and drill into
  it (or transfer the whole folder).

### Add source (folders/files from anywhere)
- **"Add Folder(s)..."** and **"Add Files..."**, above the tree, open **separate
  native Windows pickers** so you can add sources that aren't on the connected
  drive at all — a network path, another local drive, anywhere.
- "Add Folder(s)..." re-opens the standard folder browser after each pick and
  asks whether to add another, so you can add several folders in one go
  (Windows has no built-in multi-select folder dialog); every sub-folder and
  file under a picked folder is included automatically.
- "Add Files..." opens a standard multi-select file dialog — pick as many
  individual files as you like in one go.
- Everything added this way shows up in the **"Added sources"** list under the
  tree and is always included in the transfer, in addition to whatever's
  ticked in the tree. Select one or more entries and click **Remove Selected**,
  or **Clear Added** to remove them all.

### CMS case number / OP name
- Provide **either**:
  - a **CMS case** — must begin with the configured prefix (default **`CMS-A`**)
    and include an identifier, e.g. `CMS-A12345`; **or**
  - an **OP name** — must be **UPPERCASE** (the box forces upper case as you type).
- If both are filled in, the **CMS case takes precedence**. The chosen value
  becomes the **destination folder name** and **archive file name prefix**. Each
  hint highlights until its value is valid.

### Auto-transfer
- Tick **"Auto-transfer when a USB drive is plugged in"** to start the transfer
  automatically on insert, with **no prompts**. It only requires that a valid
  **CMS case or OP name** is already entered; if neither is set you're asked to
  add one. All currently-selected folders/files (all by default) are transferred.

### Options panel (all settings, on the main screen)
Everything is editable on the **Options** panel — destination,
7-Zip path, temp folder, case prefix, **archive format**, **volume/split
size (sizing)**, compression level, password, hashing, manifest embedding,
verification, prompt-on-insert, select-all default, delete-local and exclude
patterns. Changes apply immediately when you press **Start**; **Save Options**
writes them to `config.json`. Every checkbox can be ticked *and* un-ticked.

**Combined archive** — every folder/file you select is always packed into a
**single** archive (this is fixed behavior, not a setting): one shared
manifest lists every file, prefixed with its original top-level folder name so
nothing collides. Nothing transfers until that one compression pass finishes.

---

## 3. Running a transfer

1. **Connect the USB drive** — it is scanned and its contents listed. With
   prompt-on-insert on (and auto-transfer off) a **Yes/No** dialog appears.
2. Confirm/adjust the **selection** and enter a **CMS case, OP name or pass
   number**.
3. Click **Start Transfer**. The tool first runs a **destination free-space
   check** (see below); if that passes, confirm the summary dialog — it lists
   every selected item's full source path, the destination folder and the
   resulting archive names. (Both the space check and this dialog are skipped
   under auto-transfer, which never prompts.)
4. A **"Transfer in progress"** window opens, mirroring the activity log and
   showing compress/transfer progress and a running transferred-file count.
5. Watch the **activity log**:
   - `STEP` (blue) = stage boundaries, `OK` (green) = success,
     `WARN` (amber), `ERROR` (red).

### Destination free-space check
Before the job starts, the tool sums the size of your selected items and
estimates the compressed size at your current settings, then compares that to
the free space actually available at the destination (UNC share or local
folder). If it looks like it won't fit, a dialog offers a suggested
format/compression level expected to fit — **Apply Suggested Settings &
Continue**, **Continue Anyway**, or **Cancel**. This is a **planning estimate
only**: already-compressed data (photos, video, zip/7z files) shrinks far less
than typical documents, so treat the suggestion as a guide, not a guarantee.

### What happens internally
1. **Hash** every original file across your whole selection → one manifest
   (`.txt` human-readable + `.csv`), each entry prefixed by its top-level
   folder name.
2. **Compress** everything together with 7-Zip into ONE archive, **embedding
   the manifest**.
3. As soon as that archive (or its volumes) finishes writing, it is **queued
   for transfer** to the destination.
4. **Transfer** via robocopy (retry/resume) to `<dest>\<CASE>\<CASE>.<fmt>`.
   A destination file name clash is never overwritten — a date/time is
   appended instead.
5. If **VerifyAfterTransfer** is on, the archive is **re-hashed at the
   destination** and compared (SHA-256).
6. Once a file's transfer is **confirmed** (copied, and hash-verified if
   verification is on), it is deleted from the local temp area straight
   away — see "Temp cleanup" below.

A per-case log is also written to
`…\TempFolder\<CASE>\<CASE>.log`.

### Temp cleanup
"Delete temp files once confirmed transferred" (on by default) removes
each local file the moment its transfer is confirmed, and sweeps the whole
temp job folder once *every* file in the job is confirmed — the temp folder is
cleared automatically as soon as the transfer to the destination succeeds. If a file failed to
copy, or failed verification, it — and the rest of that job's temp folder — is
**left in place** for you to review; nothing is ever deleted on an unconfirmed
or failed transfer.

### Cancelling
**Cancel** is immediate: it kills the running 7-Zip/robocopy process within a
fraction of a second and deletes the temp files for the job. Archives already
confirmed on the share stay there, and a "FAILED TRANSFER" log listing them
(names, SHA-256, sizes, times) is written and sent to the destination.

### Notification sounds
The tool plays the Windows **Critical Stop** sound the moment any error is
logged (compress/transfer/verify failures, etc.), and the Windows
**Asterisk** (information) sound once a job finishes with everything
confirmed. Both use your system's default sound scheme, so they follow your
Windows volume/mute settings automatically.

---

## 4. Output layout

```
C:\Destination\
└─ CMS-A12345\
   └─ CMS-A12345.7z        ← one combined archive (manifest embedded inside)
```

Inside the `.7z`:
```
Photos\...                         (original files, grouped by top-level folder)
Documents\...
CMS-A12345_MANIFEST.txt           (human-readable hashes, all items)
CMS-A12345_MANIFEST.csv           (machine-readable hashes, all items)
```

Manifest header records: case number, source path, UTC timestamp, machine,
operator, file count and algorithms — a lightweight chain-of-custody record.

**Split works for both `zip` and `7z`.** 7-Zip's own volume switch only splits
its native `.7z` format — it silently ignores splitting for `.zip`. This tool
works around that: for `zip`, it builds the whole archive first and then
splits it itself into `.001`/`.002`/… parts (the same raw byte layout 7-Zip's
own volumes use), so a `zip` job with a split size set actually produces
volumes instead of one large file. Reassemble either format's volumes by
opening the `.001` in 7-Zip, or — without 7-Zip — concatenate the parts in
order: `copy /b file.zip.001+file.zip.002 file.zip`.

**Volumes transfer as soon as each one is ready (zip only).** For `zip`, the
tool writes `.001`, `.002`, … strictly in order — `.001` is completely closed
before `.002` is even started — so each volume's completion is known exactly,
and `.001` starts uploading immediately while later volumes are still being
written. `7z`'s own `-v` volumes don't get this treatment: 7-Zip is a separate
process, and it does **not** necessarily finish writing its volumes in
ascending numeric order internally (the first volume file can, in some cases,
be the *last* one it actually finishes) — so for `7z`, all volumes are only
picked up for transfer together, once the whole 7-Zip process has exited and
every volume is confirmed complete. This avoids any risk of transferring a
volume that looks present on disk but isn't actually finished yet.

---

## 5. Settings reference

Edit the **Options** panel on the main screen and click **Save Options** (or
re-run `Setup.ps1`). All values persist to `config.json`.

| Setting | Meaning |
|---|---|
| Destination | UNC share or local folder for archives; default `C:\Destination` |
| 7-Zip path | Blank = auto-detect |
| Temp folder | Local temp area for archives; default `C:\temp` |
| Case prefix | Required prefix for case numbers (`CMS-A`) |
| Archive format | `zip` (default, portable) or `7z` (smaller) |
| Split into volumes (MB) | Max size per file; default **250 MB**; `0` = single file |
| Compression level | 0 (store) … 9 (ultra) |
| Archive password | Optional AES-256 (encrypts headers too on `7z`) |
| Hash SHA-256 / MD5 | Which hashes to compute |
| Embed manifest | Include the manifest inside each archive |
| Prompt on insert | Show the Yes/No dialog automatically (when auto-transfer is off) |
| Auto-transfer | Start automatically on insert; needs a CMS case or OP name |
| Select all by default | Pre-tick every folder/file |
| Verify after transfer | Re-hash the archive at the destination |
| Delete temp files once confirmed transferred | Default **on**. Removes each file once its transfer is confirmed, and clears the whole temp folder automatically once the job is fully confirmed transferred; failed/unverified items are kept |
| Exclude patterns | Names to skip (e.g. `System Volume Information`) |

---

## 6. Troubleshooting

| Symptom | Fix |
|---|---|
| "7-Zip not found" | Install 7-Zip or set the path in the Options panel. |
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
