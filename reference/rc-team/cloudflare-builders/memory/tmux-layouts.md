# Tmux Layout Templates

## "full-tdd" — 6 agents, TDD pair (tess+sven)

```yaml
layout: full-tdd
agents: [lead, finn, marcus, tess, sven, dag]
vertical:
  - width: 30%
    horizontal:
      - height: 50%
        name: lead
      - height: 50%
        name: finn
  - width: 70%
    horizontal:
      - height: 33%
        name: marcus
      - height: 33%
        vertical:
          - width: 50%
            name: tess
          - width: 50%
            name: sven
      - height: 33%
        name: dag
```

### Build sequence

```bash
# Assumes: lead is %0, all agents spawned into separate windows
# 1. Break all agent panes out of their current positions
tmux break-pane -s $FINN -d
tmux break-pane -s $MARCUS -d
tmux break-pane -s $TESS -d
tmux break-pane -s $SVEN -d
tmux break-pane -s $DAG -d

# 2. Join finn under lead (left column)
tmux join-pane -s $FINN -t %0 -v -l 31

# 3. Join marcus right of lead (top-right) — use explicit -l, not -p
tmux join-pane -s $MARCUS -t %0 -h -l 155

# 4. Join dag below marcus
tmux join-pane -s $DAG -t $MARCUS -v -l 42

# 5. Join tess between marcus and dag
tmux join-pane -s $TESS -t $DAG -v -l 21
tmux swap-pane -s $TESS -t $DAG

# 6. Join sven as right half of tess
tmux join-pane -s $SVEN -t $TESS -h -l 77

# 7. Equalize right-side rows
tmux resize-pane -t $MARCUS -y 20
tmux resize-pane -t $TESS -y 20
# dag gets the remainder
```

**Gotcha:** Use `-l` (explicit pixel size) instead of `-p` (percentage) — tmux often returns "size missing" with `-p` on join-pane.

---

## "full-review" — 7 agents, review pair (marcus+arvo) + TDD pair (tess+sven)

```yaml
layout: full-review
agents: [lead, finn, marcus, arvo, tess, sven, dag]
vertical:
  - width: 30%
    horizontal:
      - height: 50%
        name: lead
      - height: 50%
        name: finn
  - width: 70%
    horizontal:
      - height: 35%
        vertical:
          - width: 50%
            name: marcus
          - width: 50%
            name: arvo
      - height: 35%
        vertical:
          - width: 50%
            name: tess
          - width: 50%
            name: sven
      - height: 30%
        name: dag
```

---

## "lite" — 2 agents

```yaml
layout: lite
agents: [lead, finn]
vertical:
  - width: 30%
    name: lead
  - width: 70%
    name: finn
```
