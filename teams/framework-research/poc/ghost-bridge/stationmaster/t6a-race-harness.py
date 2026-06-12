#!/usr/bin/env python3
# t6a-race-harness.py -- re-run of TRUTHS.md T6.a on the deployment substrate.
#
# T6.a (Windows, CLI 2.1.170): "Exclusive-create is atomic on this substrate.
# 50 rounds of two concurrent processes exclusive-creating the same path --
# exactly one winner every round, zero anomalies, zero mixed content."
# Linux re-run was owed before deploy (SPEC-v3 D10 substrate note; courier
# hints doc Sec.4: "T6.a's race harness was run on Windows; re-run on the
# deployment platform").
#
# WHAT THIS GATES: the CUSTOMER COURIER's inbound inject step (courier hints
# Sec.4 step 3) uses open(path, 'x') / O_CREAT|O_EXCL to land a batch into a
# live, harness-contested inbox without clobbering a file the harness may
# recreate in the race window. The whole inbound discipline rests on that one
# call being atomic on the target filesystem. This harness proves it there.
#
# WHAT THIS DOES NOT GATE: the stationmaster HUB. The hub spool serialises
# writers with flock (sm-shell), not exclusive-create -- it is insensitive to
# T6.a. Run this on the filesystem where the COURIER will run, which is the
# customer team's ~/.claude/teams/<team>/inboxes/ volume.
#
# Tier R: scratch files in a temp dir, created and removed; touches no
# deployed state. stdlib only.
#
# Usage:
#   python3 t6a-race-harness.py [--rounds N] [--dir PATH]
#   # --dir defaults to a tempdir on the current filesystem; pass the actual
#   #   inbox-dir filesystem to gate the real target (rename/create atomicity
#   #   is per-volume, so the filesystem under test must match).
#
# PASS criterion: every round has exactly one winner, the loser fails cleanly
# (FileExistsError), and the winner's content survives intact. Any round with
# zero winners, two winners, or mixed/corrupt content is an anomaly -> FAIL.
# (*FR:Brunel*)

import os
import sys
import json
import argparse
import tempfile
import multiprocessing as mp
from pathlib import Path


def contender(path, token, result_q):
    """Try to exclusively create `path` and write our token. Report whether we
    won (created it) and what we wrote."""
    try:
        # O_CREAT|O_EXCL is the syscall the courier's 'x' mode compiles to.
        fd = os.open(str(path), os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError:
        result_q.put({"token": token, "won": False, "wrote": None})
        return
    except OSError as e:
        result_q.put({"token": token, "won": False, "error": str(e)})
        return
    try:
        payload = json.dumps({"winner": token}).encode()
        os.write(fd, payload)
        os.fsync(fd)
    finally:
        os.close(fd)
    result_q.put({"token": token, "won": True, "wrote": token})


def run_round(rnd, workdir):
    path = workdir / f"race-{rnd}.json"
    if path.exists():
        path.unlink()
    q = mp.Queue()
    a = mp.Process(target=contender, args=(path, "A", q))
    b = mp.Process(target=contender, args=(path, "B", q))
    # Start as close to simultaneously as the OS allows.
    a.start(); b.start()
    a.join(); b.join()

    results = [q.get(), q.get()]
    winners = [r for r in results if r.get("won")]
    errors = [r for r in results if r.get("error")]

    anomaly = None
    if len(winners) != 1:
        anomaly = f"{len(winners)} winners (expected exactly 1)"
    else:
        # Confirm the on-disk content matches the winner and is not mixed.
        try:
            on_disk = json.loads(path.read_text())
            if on_disk.get("winner") != winners[0]["token"]:
                anomaly = f"content {on_disk!r} != winner {winners[0]['token']}"
        except (ValueError, OSError) as e:
            anomaly = f"unreadable/corrupt content: {e}"
    if errors:
        # An OSError other than FileExistsError on the loser is itself notable.
        anomaly = (anomaly + "; " if anomaly else "") + \
            f"unexpected errors: {[e['error'] for e in errors]}"

    path.unlink(missing_ok=True)
    return {"round": rnd,
            "winner": winners[0]["token"] if len(winners) == 1 else None,
            "anomaly": anomaly}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--rounds", type=int, default=50)
    ap.add_argument("--dir", default=None,
                    help="filesystem to test on (default: tempdir on CWD's FS)")
    args = ap.parse_args()

    if args.dir:
        workdir = Path(args.dir)
        workdir.mkdir(parents=True, exist_ok=True)
        cleanup = False
    else:
        workdir = Path(tempfile.mkdtemp(prefix="t6a-", dir="."))
        cleanup = True

    print(f"T6.a re-run: {args.rounds} rounds, two concurrent exclusive-creates")
    print(f"filesystem under test: {workdir.resolve()}")
    print(f"platform: {sys.platform}  python: {sys.version.split()[0]}")
    print("-" * 60)

    anomalies = []
    win_a = win_b = 0
    for rnd in range(1, args.rounds + 1):
        res = run_round(rnd, workdir)
        if res["winner"] == "A":
            win_a += 1
        elif res["winner"] == "B":
            win_b += 1
        if res["anomaly"]:
            anomalies.append(res)
            print(f"  round {rnd:3d}: ANOMALY -- {res['anomaly']}")

    print("-" * 60)
    print(f"winners: A={win_a}  B={win_b}  (sum should == rounds == {args.rounds})")
    print(f"anomalies: {len(anomalies)}")

    if cleanup:
        try:
            workdir.rmdir()
        except OSError:
            pass

    if anomalies or (win_a + win_b) != args.rounds:
        print("RESULT: FAIL -- exclusive-create is NOT reliably atomic here.")
        print("        The courier inbound-inject discipline CANNOT rely on")
        print("        open(path,'x') on this filesystem. Surface to Brunel.")
        sys.exit(1)
    print("RESULT: PASS -- exactly one winner every round, content intact.")
    print("        T6.a holds on this substrate; courier inbound discipline OK.")
    sys.exit(0)


if __name__ == "__main__":
    main()
