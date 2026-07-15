# Fault-injection durability test for sm-shell (#97).
# Proves "accepted" is never emitted when a directory fsync fails -- the
# graceful smoke test cannot catch this (page cache satisfies it). Run:
#   python3 test_durability.py

import importlib.util, os, sys, io, tempfile, stat, errno, json
from pathlib import Path

spec = importlib.util.spec_from_loader("sm", importlib.machinery.SourceFileLoader("sm", "./sm-shell"))
sm = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sm)

def is_dir_fd(fd):
    try:
        return stat.S_ISDIR(os.fstat(fd).st_mode)
    except OSError:
        return False

real_fsync = os.fsync
def make_faulty(target="dir"):
    def faulty(fd):
        if (target=="dir") == is_dir_fd(fd):
            raise OSError(errno.EIO, "injected")
        return real_fsync(fd)
    return faulty

# --- Test 1: happy path, real fsync, deposit emits accepted ---
d = tempfile.mkdtemp()
sm.STATE_ROOT = Path(d)
sm.ensure_layout()
# register + grant so deposit is allowed
reg = {"sender": {"registered": sm.now_iso()}, "recv": {"registered": sm.now_iso()}}
sm.store_json(sm.STATE_ROOT/"registry.json", reg)
sm.store_json(sm.grants_path("recv"), {"grants_in":[{"from":"sender","since":sm.now_iso()}]})

def run_deposit():
    buf = io.StringIO()
    old = sys.stdout; sys.stdout = buf
    try:
        entry = {"from":"sender","text":"hi","type":"message"}
        cons = json.dumps({"to":"recv","entry":entry})
        sm.cmd_deposit("sender", {}, [cons], sm.load_registry())
    except SystemExit:
        pass
    except OSError as e:
        buf.write(f"\n<<RAISED OSError {e.errno}>>")
    finally:
        sys.stdout = old
    return buf.getvalue()

out = run_deposit()
assert '"status": "accepted"' in out or '"status":"accepted"' in out, f"T1 happy path should accept: {out}"
print("T1 happy path -> accepted  OK")

# --- Test 2: fsync_dir must RAISE under injected dir-fsync fault (no swallow) ---
os.fsync = make_faulty("dir")
raised = False
try:
    sm.fsync_dir(sm.STATE_ROOT/"spool")
except OSError as e:
    raised = (e.errno == errno.EIO)
os.fsync = real_fsync
assert raised, "T2 fsync_dir must propagate EIO on posix, not swallow"
print("T2 fsync_dir raises on injected dir fault  OK")

# --- Test 3: deposit under injected dir-fsync fault must NOT emit accepted ---
d2 = tempfile.mkdtemp(); sm.STATE_ROOT = Path(d2); sm.ensure_layout()
sm.store_json(sm.STATE_ROOT/"registry.json", reg)
sm.store_json(sm.grants_path("recv"), {"grants_in":[{"from":"sender","since":sm.now_iso()}]})
os.fsync = make_faulty("dir")
out3 = run_deposit()
os.fsync = real_fsync
assert "accepted" not in out3, f"T3 MUST NOT accept under durability fault: {out3!r}"
assert "RAISED OSError" in out3 or "E_INTERNAL" in out3, f"T3 should fail loud: {out3!r}"
print("T3 deposit under dir-fsync fault -> NO accept, fails loud  OK")

# --- Test 4: platform guard is False here (posix) ---
assert sm._DIR_FSYNC_UNSUPPORTED is False, "T4 must do real fsync on this posix host"
print("T4 _DIR_FSYNC_UNSUPPORTED is False on posix  OK")
print("\nALL FAULT-INJECTION TESTS PASSED")
