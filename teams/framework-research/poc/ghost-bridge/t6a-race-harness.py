#!/usr/bin/env python3
"""
T6.a race harness -- exclusive-create atomicity gate.
(*FR:Hopper*)

Re-run of the S48 Test #6 cell A race test on a target filesystem. Verifies the
load-bearing primitive that stationmaster-courier.py:_exclusive_create_json
relies on (SPEC-v3 D11 step 3; courier-hints S4 step 3; TRUTHS.md T6.a):

    open(path, "x")  ==  O_CREAT|O_EXCL  is atomic per-filesystem:
    two concurrent processes exclusive-creating the SAME path ->
    exactly one winner per round, zero anomalies, zero mixed content.

Atomicity is per-filesystem, so this must run ON the filesystem the hub's
spool+inboxes will occupy (the sm-state named volume mounted at
/var/lib/stationmaster inside the container), not merely the bare host fs.

Two sub-tests, both from TRUTHS.md T6.a:
  A. Python  open(mode="x")          -- the courier's actual call site.
  B. Bash    set -C (noclobber)      -- the shell-level equivalent T6.a cites.

Usage:  python3 t6a-race-harness.py [ROUNDS] [TARGET_DIR]
  ROUNDS      default 50 (matches S48 evidence)
  TARGET_DIR  default: a fresh mkdtemp; pass a path ON the volume under test.

Exit 0 = gate PASS (all rounds clean). Exit 1 = gate FAIL (any anomaly).
Self-cleaning: removes only files it created under TARGET_DIR.
"""
import os
import sys
import json
import time
import shutil
import tempfile
import platform
import subprocess
import multiprocessing as mp

WINNER_TAG = "WIN"
ROUND_BYTES = b'[{"from":"t6a-probe","msg":"exclusive-create-winner"}]'


def py_attempt(path, pid_tag, barrier, result_q):
    """One process's exclusive-create attempt. Mirrors _exclusive_create_json:
    open(path,'x') + write + flush + fsync. Reports won/lost/error."""
    barrier.wait()  # release both contenders as close to simultaneously as possible
    try:
        with open(path, "x", encoding="utf-8") as fh:
            payload = json.dumps([{"winner": pid_tag, "msg": WINNER_TAG}],
                                 ensure_ascii=False, indent=2)
            fh.write(payload)
            fh.flush()
            os.fsync(fh.fileno())
        result_q.put((pid_tag, "won"))
    except FileExistsError:
        result_q.put((pid_tag, "lost"))
    except Exception as exc:  # noqa: BLE001 -- harness must surface any anomaly
        result_q.put((pid_tag, f"error:{type(exc).__name__}:{exc}"))


def run_python_race(target_dir, rounds):
    anomalies = []
    winners = 0
    for r in range(rounds):
        path = os.path.join(target_dir, f"py-round-{r:03d}.json")
        ctx = mp.get_context("fork") if sys.platform != "win32" else mp.get_context("spawn")
        barrier = ctx.Barrier(2)
        q = ctx.Queue()
        p1 = ctx.Process(target=py_attempt, args=(path, "A", barrier, q))
        p2 = ctx.Process(target=py_attempt, args=(path, "B", barrier, q))
        p1.start(); p2.start()
        p1.join(); p2.join()
        outcomes = {}
        while not q.empty():
            tag, res = q.get()
            outcomes[tag] = res
        won = [t for t, res in outcomes.items() if res == "won"]
        lost = [t for t, res in outcomes.items() if res == "lost"]
        errs = [f"{t}:{res}" for t, res in outcomes.items() if res.startswith("error")]
        # Verify EXACTLY one winner, one loser, no errors.
        if len(won) != 1 or len(lost) != 1 or errs:
            anomalies.append(f"round {r}: outcomes={outcomes}")
            continue
        winners += 1
        # Verify the file content is the winner's, intact, no mixed content.
        try:
            content = open(path, encoding="utf-8").read()
            data = json.loads(content)
            if not (isinstance(data, list) and len(data) == 1
                    and data[0].get("winner") == won[0]
                    and data[0].get("msg") == WINNER_TAG):
                anomalies.append(f"round {r}: content-mismatch winner={won[0]} content={content!r}")
        except Exception as exc:  # noqa: BLE001
            anomalies.append(f"round {r}: content-read-error {type(exc).__name__}:{exc}")
    return winners, anomalies


BASH_RACER = r'''
set -C
target="$1"; tag="$2"; gate="$3"
# spin-wait on a shared gate file so both racers fire together
while [ ! -f "$gate" ]; do :; done
if { echo "[{\"winner\":\"$tag\"}]" > "$target"; } 2>/dev/null; then
  echo "$tag won"
else
  echo "$tag lost"
fi
'''


def run_bash_race(target_dir, rounds):
    racer = os.path.join(target_dir, "_racer.sh")
    with open(racer, "w") as fh:
        fh.write(BASH_RACER)
    anomalies = []
    winners = 0
    for r in range(rounds):
        path = os.path.join(target_dir, f"bash-round-{r:03d}.json")
        gate = os.path.join(target_dir, f"_gate-{r:03d}")
        # launch both racers paused on the gate, then release
        p1 = subprocess.Popen(["bash", racer, path, "A", gate],
                              stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)
        p2 = subprocess.Popen(["bash", racer, path, "B", gate],
                              stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)
        time.sleep(0.01)
        open(gate, "w").close()  # release
        o1, _ = p1.communicate()
        o2, _ = p2.communicate()
        results = (o1 + o2).split()
        # results like ['A','won','B','lost']
        text = o1.strip() + " | " + o2.strip()
        won = text.count("won")
        lost = text.count("lost")
        if won != 1 or lost != 1:
            anomalies.append(f"round {r}: bash outcomes={text!r}")
            continue
        winners += 1
        try:
            data = json.loads(open(path).read())
            if not (isinstance(data, list) and len(data) == 1 and "winner" in data[0]):
                anomalies.append(f"round {r}: bash content-mismatch {open(path).read()!r}")
        except Exception as exc:  # noqa: BLE001
            anomalies.append(f"round {r}: bash content-read-error {type(exc).__name__}:{exc}")
    return winners, anomalies


def main():
    rounds = int(sys.argv[1]) if len(sys.argv) > 1 else 50
    if len(sys.argv) > 2:
        target_dir = sys.argv[2]
        os.makedirs(target_dir, exist_ok=True)
        created_dir = False
    else:
        target_dir = tempfile.mkdtemp(prefix="t6a-")
        created_dir = True

    # Substrate fingerprint -- version-stamp the evidence.
    print("=== T6.a RACE HARNESS (*FR:Hopper*) ===")
    print(f"timestamp_utc : {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}")
    print(f"python        : {platform.python_version()}")
    print(f"platform      : {platform.platform()}")
    print(f"target_dir    : {target_dir}")
    # Filesystem type of the target dir (load-bearing: atomicity is per-fs).
    try:
        df = subprocess.run(["df", "-T", target_dir], capture_output=True, text=True)
        print("df -T target  :")
        print("  " + df.stdout.strip().replace("\n", "\n  "))
    except Exception as exc:  # noqa: BLE001
        print(f"df -T target  : (unavailable: {exc})")
    print(f"rounds        : {rounds}")
    print()

    py_winners, py_anom = run_python_race(target_dir, rounds)
    print(f"[A] Python open(mode='x') : {py_winners}/{rounds} clean rounds, {len(py_anom)} anomalies")
    for a in py_anom:
        print(f"    ANOMALY {a}")

    bash_winners, bash_anom = run_bash_race(target_dir, rounds)
    print(f"[B] Bash set -C noclobber : {bash_winners}/{rounds} clean rounds, {len(bash_anom)} anomalies")
    for a in bash_anom:
        print(f"    ANOMALY {a}")

    total_anom = len(py_anom) + len(bash_anom)
    py_pass = py_winners == rounds and not py_anom
    bash_pass = bash_winners == rounds and not bash_anom
    gate_pass = py_pass and bash_pass

    print()
    print(f"=== GATE RESULT: {'PASS' if gate_pass else 'FAIL'} ===")
    print(f"    python  : {'PASS' if py_pass else 'FAIL'} ({py_winners}/{rounds})")
    print(f"    bash    : {'PASS' if bash_pass else 'FAIL'} ({bash_winners}/{rounds})")
    print(f"    anomalies total: {total_anom}")

    # Self-clean only what we created.
    try:
        if created_dir:
            shutil.rmtree(target_dir, ignore_errors=True)
        else:
            for f in os.listdir(target_dir):
                if f.startswith(("py-round-", "bash-round-", "_racer.sh", "_gate-")):
                    try:
                        os.remove(os.path.join(target_dir, f))
                    except OSError:
                        pass
        print("    cleanup : done")
    except Exception as exc:  # noqa: BLE001
        print(f"    cleanup : WARN {exc}")

    sys.exit(0 if gate_pass else 1)


if __name__ == "__main__":
    main()
