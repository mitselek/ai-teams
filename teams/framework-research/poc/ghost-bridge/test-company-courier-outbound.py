import importlib.util, json, os, sys, tempfile, types
from pathlib import Path

# load reference + daemon
def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
REF="/Users/michelek/Documents/github/ai-teams/teams/framework-research/poc/ghost-bridge/stationmaster-courier.py"
DAE="./company-courier.py"
sm = load("sm_courier", REF)
spec = importlib.util.spec_from_file_location("cc", DAE)
cc = importlib.util.module_from_spec(spec); spec.loader.exec_module(cc)
cc.sm = sm  # bind the reference into the daemon

d = tempfile.mkdtemp()
state = Path(d)/"state"; inboxes = Path(d)/"inboxes"
state.mkdir(); inboxes.mkdir()
# pre-create sender + team-lead inbox files (guard 3: inbox must already exist)
(inboxes/"gama.json").write_text("[]")
(inboxes/"team-lead.json").write_text("[]")

raw = {"team":"po-team","ssh_target":"sm@hub","ssh_key":"/dev/null",
       "ssh_opts":["-p","2222"],"inboxes_dir":str(inboxes),
       "ghost_outboxes":["outbox"],"target_inbox":"team-lead","default_inbox":"team-lead",
       "state_dir":str(state),"poll_interval_s":30,"collect_limit":100}
cfg = cc.build_cfg(raw)
cfg.spool_dir.mkdir(parents=True, exist_ok=True)
cfg.inject_tmp_dir.mkdir(parents=True, exist_ok=True)

# --- mock the ssh deposit: accept 'mvox', reject 'nogrant-team' with E_NOGRANT ---
deposited=[]
def fake_deposit(config, consignments):
    lines=[]
    for c in consignments:
        deposited.append(c)
        if c["to"]=="mvox":
            lines.append({"id":"abc123","to":"mvox","status":"accepted"})
        else:
            lines.append({"id":None,"to":c["to"],"status":"rejected","error":{"code":"E_NOGRANT","detail":"no grant"}})
    return sm.HubResponse({"v":1,"ok":True,"cmd":"deposit"}, lines)
sm.cmd_deposit = fake_deposit

# --- craft a spool file with 3 entries: good route, parse-fail, hub-reject ---
spool_entries = [
  {"from":"gama","text":"to: mvox\nHello mvox, real body here.","type":"message"},
  {"from":"gama","text":"oops no to-line\nbody","type":"message"},
  {"from":"gama","text":"to: nogrant-team\nwill be rejected","type":"message"},
]
(cfg.spool_dir/"0001.json").write_text(json.dumps(spool_entries))

cc.deposit_spool_routed(cfg)

# --- assertions ---
gama_inbox = json.loads((inboxes/"gama.json").read_text())
bounces = [e for e in gama_inbox if e.get("type")=="bounce"]
print("deposited to hub:", [c['to'] for c in deposited])
print("gama bounces:", len(bounces))
for b in bounces: print("   bounce reason:", b['summary'])
assert any(c["to"]=="mvox" for c in deposited), "good message should deposit to mvox"
assert len(bounces)==2, f"expected 2 bounces (parse-fail + hub-reject), got {len(bounces)}"
assert any("hub rejected" in b['text'] for b in bounces), "hub-reject should bounce with reason"
# spool file should be gone (all 3 terminally handled)
assert not (cfg.spool_dir/"0001.json").exists(), "spool should be cleaned"
print("\nPASS: good->deposited, parse-fail->bounced, hub-reject->bounced, spool cleaned")

# --- flock test: second guard on same lock fails ---
g1 = cc._FlockGuard(cfg.lock_path).__enter__()
try:
    cc._FlockGuard(cfg.lock_path).__enter__()
    print("FAIL: second flock should have raised"); sys.exit(1)
except RuntimeError:
    print("PASS: second instance refused by flock")
print("\nALL OUTBOUND TESTS PASSED")
