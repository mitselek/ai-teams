# Box allocation: teams on ai-screenwerk-ee, hub + PO team on ai-mvox-eu

**Decision (2026-07-15, comms gap 1):** the two existing Hostinger KVM 2 boxes are
reallocated with zero new spend:

- **ai-screenwerk-ee** → product-team containers (built on the near-empty box)
- **ai-mvox-eu** → hub + PO team (freed by migrating mvox into a container)

**Why this direction:** build quietly on the empty box, cut the busy one over at an
idle seam — instead of doing container surgery on a live machine. The 12 GB mvox home
moves box-to-box over the tailnet in one stream.

**Scaling posture:** upgrade-renewal pricing at Hostinger is punitive (KVM 2 renews
$16.99, upgraded KVM 4 renews $42.99); when capacity pressure arrives — it fails
loud and visibly — compare upgrading in place vs renting a fresh box at new-customer
promo and moving containers (they are portable by design).
