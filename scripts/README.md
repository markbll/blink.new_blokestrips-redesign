# Large File Zip & Transfer Utility

`Large-File-Zip-Transfer.ps1` is a Windows PowerShell/WinForms GUI tool for moving a large
folder (media assets, project backups, etc.) to a network destination reliably: it splits the
source into fixed-size chunks with 7-Zip, then transfers those chunks with Robocopy.

Requires [7-Zip](https://www.7-zip.org/) installed at its default location; the script checks
for it on launch and offers the download page if it's missing.

## What it does

### Phase 1: Initialization & Setup
- **7-Zip check:** verifies 7-Zip is installed in the default Program Files directories. If not,
  shows an error and opens the 7-Zip download page.
- **GUI construction:** builds a form with an Archive Base Name field, folder pickers for
  Source / Temp / Final Destination, a read-only log window, and a Start Process button.

### Phase 2: Input Validation
- **Name check:** base name must be non-empty and free of invalid Windows filename characters
  (`?`, `*`, `:`, etc.).
- **Path check:** all three folder paths must be selected, and the Source folder must actually
  exist on disk.
- **UI lock:** disables Start and shows a wait cursor to prevent double-clicks.

### Phase 3: Archiving & Splitting (7-Zip)
- Creates a unique, timestamped subfolder under Temp (e.g. `MyProject_20260806_143000`) to
  avoid collisions between runs.
- Runs 7-Zip in the background with `-tzip -mx0 -v250m`: standard zip format, no compression
  (store mode, for speed), split into 250 MB chunks.
- Keeps the GUI responsive and logs elapsed time every 15 seconds so long jobs don't look frozen.

### Phase 4: File Renaming
- 7-Zip names split output `Archive.zip.001`, `Archive.zip.002`, etc. The script renames these
  to `Archive.001`, `Archive.002`, ...

### Phase 5: Reliable Transfer (Robocopy)
- Copies the chunk files from Temp to the Final Destination with:
  - `/Z` — restartable mode, resumes mid-file after a network drop.
  - `/J` — unbuffered I/O, avoids RAM cache thrashing on large files.
  - `/MT:8` — 8 files copied concurrently, so multiple chunks transfer in parallel.
  - `/R:5 /W:10` — retries a failed file 5 times, 10 seconds apart.
  - `/LOG:` — full per-file robocopy log written into the job's temp folder for troubleshooting.
- Logs elapsed time every 15 seconds while copying.

### Phase 6: Verification & Cleanup
- Exit code check: treats Robocopy codes 0-7 as success, ≥8 as failure.
- **Verification:** compares every chunk in the temp folder against its counterpart at the
  destination (existence + byte size). If anything is missing or mismatched, the job stops,
  temp files are kept, and the robocopy log path is shown — nothing is offered for deletion.
- On a clean verification, prompts **"Delete temporary files?"**:
  - **Yes** — deletes the timestamped temp folder.
  - **No** — leaves it in place.
- Re-enables the Start button for the next job.

## Performance & reliability notes (network destinations)

Changes already in the script, tuned for copying to a network share:

- **`/MT:8`** is the biggest lever here — without it, Robocopy copies one chunk at a time.
  With several 250 MB chunks sitting in the temp folder, concurrent transfer uses available
  bandwidth much better than a serial copy, especially over higher-latency links.
- **`/R:5 /W:10`** (up from `/R:3 /W:5`) gives transient network blips more room to clear
  without failing the whole job, while still bailing out in well under a minute per file rather
  than hanging indefinitely.
- **`/LOG:`** now writes a full per-file robocopy log to the temp folder — previously `/NFL /NDL`
  suppressed that detail entirely, which made a mid-transfer failure hard to diagnose.
- **Post-copy size verification** — Robocopy's exit code reflects what Robocopy itself observed,
  which isn't the same as an independent guarantee every byte landed on a flaky network mount.
  The script now compares each chunk's size at the source and destination before ever offering
  to delete the temp copy (your only remaining full copy of the data).

Ideas not implemented, worth considering if this becomes a heavier-duty tool:

- **Overlap zipping and copying.** Right now Robocopy only starts after 7-Zip finishes
  completely. Since 7-Zip finishes each `.zip.NNN` chunk before starting the next, a chunk could
  in principle be copied as soon as it's complete rather than waiting for the whole archive.
  This would meaningfully shorten total wall-clock time on large jobs, but needs care to avoid
  copying a chunk that's still being written (e.g. only copy chunks below the current highest
  chunk number, with a short settle delay) — deferred here as added complexity/risk.
- **Compression level.** `-mx0` (store, no compression) is the right call for already-compressed
  content (video, photos, most media). If the source is text/logs/CAD/similar compressible data,
  a light setting (`-mx1`) can shrink what actually crosses the network at low CPU cost — worth
  revisiting per use case rather than hardcoding.
- **Hash-based verification.** The current check compares file size only, which catches the
  common failure mode (truncated/partial copies) cheaply. For higher assurance at the cost of
  read time, this could be upgraded to a full hash comparison (e.g. `Get-FileHash`) on each
  chunk.
- **Configurable chunk size / thread count.** `250m` and `/MT:8` are hardcoded; exposing them as
  GUI fields would let this be tuned per network link without editing the script.
