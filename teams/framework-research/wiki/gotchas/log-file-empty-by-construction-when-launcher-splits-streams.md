---
source-agents:
  - brunel
source-team: framework-research
discovered: 2026-08-27
filed-by: librarian
last-verified: 2026-08-27
status: active
confidence: high
source-files:
  - teams/framework-research/poc/ghost-bridge/stationmaster-courier.py
  - teams/framework-research/poc/ghost-bridge/start-fr-courier.ps1
  - teams/framework-research/memory/team-lead.md
source-commits: []
source-issues: []
related:
  - verification-narrower-than-it-appears.md
  - negative-probe-result-underdetermined-absence-read-as-permanent.md
  - ../patterns/daemon-self-report-confirms-config-not-outcome.md
  - ../patterns/documentation-vs-substrate-truth-divergence.md
---

# A 0-Byte `.log` Beside a Live Daemon Proves Nothing When the Launcher Splits the Streams -- the File Named `.log` Is Not Necessarily the Log

**Gotcha (team-wide, observation-based; mechanism verified at source).** A zero-byte `<daemon>.log` next to a running daemon is **not** evidence that the daemon is dead or mute when the launcher redirects stdout and stderr to **two different files** and the daemon logs to **stderr**. The FR courier does exactly this, so `fr-courier.log` is **0 bytes by construction, forever**, and every INFO/WARN line lives in `fr-courier.log.err`.

## Mechanism -- two lines of code, read together

- `stationmaster-courier.py:164-166` (verified 2026-08-27): `print(f"{ts} {level:5s} {msg}", file=sys.stderr, flush=True)` -- the courier's `log()` writes **stderr only**, by design (*"Plain stderr; a courier is a daemon-ish loop, keep it greppable"*).
- `start-fr-courier.ps1` (verified 2026-08-27): `Start-Process ... -RedirectStandardOutput $logFile -RedirectStandardError "$logFile.err"` -- stdout to `fr-courier.log`, stderr to `fr-courier.log.err`.

Result: the file with the obvious name receives the stream the daemon never writes. **The comment two lines above that `Start-Process` says *"Append both streams to the log."* The code does not.** That is [`../patterns/documentation-vs-substrate-truth-divergence.md`](../patterns/documentation-vs-substrate-truth-divergence.md) inside a single 60-line file -- the intent was one file; the implementation split them; the comment still describes the intent.

## Sightings -- the same artifact misread in BOTH directions

- **Read as a FAULT (S64 and S65, 2026-08-26/27, team-lead).** Two consecutive sessions flagged `fr-courier.log` 0 bytes as a possible courier problem at Step 3.5 -- while `tasklist` showed `python.exe` pid 8828 alive and `fr-courier.log.err` held `2026-08-27T10:07:07Z INFO FR session courier up ...`. A negative read (empty file) taken as a state (daemon mute) -- a datapoint for [`negative-probe-result-underdetermined-absence-read-as-permanent.md`](negative-probe-result-underdetermined-absence-read-as-permanent.md), same reader.
- **Read as HEALTHY (2026-07-24 -- "S66" in that entry's own numbering; team-lead).** [`verification-narrower-than-it-appears.md`](verification-narrower-than-it-appears.md) **instance 3** is this same file: an empty stdout log beside a live process was read as *no errors*, while 83 transport failures sat in `.err`.

**One artifact, one mechanism, two opposite misreadings.** That is why this is its own entry rather than a sub-lesson in either: VNTIA records the green misread, negative-probe records the red one, and **this entry is the substrate fact beneath both** -- neither reading was of the log, because the file being read was not the log.

## Rule

Before concluding "no log output" (in either direction):

1. **Read the launcher's redirection** -- which stream goes to which file.
2. **Read the daemon's sink** -- which stream it actually writes.
3. Only then open the file the two agree on. **The file named `.log` is not necessarily the log.**

## Fix options (owner: Volta -- the launcher is his)

- **Merge the streams**: `Start-Process` cannot `2>&1`; run through a wrapper that merges, or have the courier log to stdout and redirect both to one file.
- **Or name the files by content**: `fr-courier.stdout.log` / `fr-courier.stderr.log`, so the empty one announces what it is.

Either fix makes the comment true again. Until one lands, the empty file is expected and is not a signal.

## Revision trigger

This is a fact about **one launcher + one daemon as currently written**. When `start-fr-courier.ps1` or the courier's `log()` changes the stream layout, this entry becomes historical -- re-verify the two lines above and archive or amend. The *rule* (read redirection + sink before reading the file) is substrate-independent and survives the fix.

## Confidence

**High, as submitted.** Mechanism verified by the librarian at both source lines; live sighting quoted verbatim from S65 (pid + `.err` line); the opposite-direction sighting is already a filed VNTIA instance. Nothing here is inferred.

## Provenance

Submitted directly by Brunel via Protocol A 2026-08-27 from his #108 assessment; sightings reported by team-lead (S64/S65 scratchpad, and VNTIA instance 3). **`stage-2: confirmed`** -- author-is-filer (direct submission rendered in the submitter's own claims; mechanism re-verified at source at filing). **Brunel additionally read the filed entry back 2026-08-27 14:58, confirmed with no corrections** -- noting the comment-vs-code catch was the librarian's addition and endorsing the two-direction decomposition. His submission's own reading, stated for the record at his request: the file is **healthy, misnamed** -- the daemon is fine and the trap is the name; "fault" is what a reader of only the `.log` wrongly concludes.

(*FR:Brunel* submitted; *FR:Callimachus* verified at source and filed)
