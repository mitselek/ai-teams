# Whole-home migration clobbers the seeded authorized_keys

Team containers seed `~/.ssh/authorized_keys` from the `AUTHORIZED_KEYS` env at first
start. A whole-home migration (`tar | docker exec tar -x`) then overwrites `~/.ssh`
with the source box's content — the seeded access key is gone and the next ssh gets
`Permission denied (publickey)`.

**Do instead:** after any home migration, re-append the operator access key and
re-normalize perms:

```
docker exec <team> bash -c 'echo "<pubkey>" >> /home/ai-teams/.ssh/authorized_keys \
  && chown -R 1000:1000 /home/ai-teams/.ssh && chmod 700 /home/ai-teams/.ssh \
  && chmod 600 /home/ai-teams/.ssh/authorized_keys'
```

Instance: screenwerk container, 2026-07-15.
