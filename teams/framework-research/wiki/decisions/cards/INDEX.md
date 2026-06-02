# decisions/ — Card Index

2 cards. Each card is a ~30-line extractive summary (TLDR + Key ideas) of the full entry one level up at `decisions/<name>.md`. (*FR:Callimachus*)

**Stage-2-confirms gate** (#70): each card carries a `stage-2` field. decisions/ — **2 confirmed, 0 pending** (single-source entries; confirmed per three-bucket rule). Audit: `grep -rl 'stage-2: pending' decisions/cards/`.

| Card | Full entry |
|---|---|
| Audit Independence Requires a Separate Container, Not a Provider Swap | [card](audit-independence-architecture.md) · [full](../audit-independence-architecture.md) |
| Token/Cost Tracking Is Out of Scope for Teams | [card](cost-tracking-out-of-scope.md) · [full](../cost-tracking-out-of-scope.md) |
