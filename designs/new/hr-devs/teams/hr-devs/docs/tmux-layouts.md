# Tmux Layout Templates

All layouts use recursive splitting — each split happens on the correct parent pane, so everything lands in place. No break/join/swap/resize needed. After splitting, spawn agents with `--target-pane %XX`.

## "full-tdd" — 6 agents, TDD pair (tess+sven)

```
| lead   | marcus              |
|        |---------------------|
|--------| tess    | sven      |
| finn   |---------------------|
|        | dag                 |
```

### Split tree

```
Window (%0)
├── split -h 30% → left (lead), right (R)
│   ├── split left -v 50% → lead, finn
│   └── split R -v 33% → marcus, RB
│       └── split RB -v 50% → tess_row, dag
│           └── split tess_row -h 50% → tess, sven
```

---

## "full-review" — 7 agents, review pair (marcus+arvo) + TDD pair (tess+sven)

```
| lead   | marcus  | arvo      |
|        |---------------------|
|--------| tess    | sven      |
| finn   |---------------------|
|        | dag                 |
```

### Split tree

```
Window (%0)
├── split -h 30% → left (lead), right (R)
│   ├── split left -v 50% → lead, finn
│   └── split R -v 35% → marcus_row, RB
│       ├── split marcus_row -h 50% → marcus, arvo
│       └── split RB -v 50% → tess_row, dag
│           └── split tess_row -h 50% → tess, sven
```

---

## "lite" — 2 agents

```
| lead (30%) | finn (70%) |
```

### Split tree

```
Window (%0)
└── split -h 30% → lead, finn
```
