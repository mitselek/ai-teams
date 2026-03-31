---
status: approved
title: comms-dev Coding Standards
description: Team-specific coding standards extending dev-toolkit for the comms relay project
doc_id: comms-dev-coding-standards
author: marconi
version: 1.0.0
last_reviewed: 2026-03-31
---

# comms-dev Coding Standards

Extends [dev-toolkit/CODING_STANDARDS.md](https://github.com/Eesti-Raudtee/dev-toolkit/blob/main/CODING_STANDARDS.md). All dev-toolkit standards apply unless overridden here.

## Tech Stack

| Component | Choice | Notes |
|-----------|--------|-------|
| Package manager | **pnpm** | Per dev-toolkit standard |
| Language | **TypeScript** (strict mode) | ESM (`"type": "module"`) |
| Runtime | **Node.js 22** | Debian containers |
| Hub framework | **Fastify** | mTLS, JSON Schema validation, Pino logging |
| Testing | **Vitest** | Anti-mocking: real certs, real sockets |
| Formatting | **Prettier** | `.prettierrc` in each package |
| Linting | **ESLint** + `eslint-plugin-sonarjs` | Cognitive complexity ≤15, nesting depth ≤4 |
| Schemas | **Zod** | MCP tool input validation |
| E2E crypto | **X25519 + Ed25519 + AES-256-GCM** | `src/crypto/crypto-v2.ts` |
| MCP transport | **stdio** | Per dev-toolkit MCP pattern |

## Project Structure (v3)

```
comms-dev/v3/
├── hub/                        # Fastify REST API + SSE server
│   ├── package.json
│   ├── tsconfig.json
│   ├── .prettierrc
│   ├── .eslintrc.json
│   ├── vitest.config.ts
│   └── src/
│       ├── server.ts           # Fastify instance + mTLS config
│       ├── routes/
│       │   ├── send.ts         # POST /api/send
│       │   ├── subscribe.ts    # GET /api/subscribe (SSE)
│       │   ├── online.ts       # GET /api/online
│       │   ├── status.ts       # GET /api/status
│       │   └── register.ts     # POST /api/register
│       ├── auth/
│       │   └── mtls.ts         # mTLS middleware + fingerprint registry
│       ├── registry/
│       │   └── peers.ts        # In-memory peer registry
│       ├── delivery/
│       │   ├── sse-manager.ts  # SSE subscription management
│       │   └── queue.ts        # SQLite offline message queue
│       └── types.ts
├── mcp/                        # MCP server for Claude Code agents
│   ├── package.json
│   ├── tsconfig.json
│   ├── .prettierrc
│   ├── .eslintrc.json
│   ├── vitest.config.ts
│   └── src/
│       ├── server.ts           # MCP server (stdio transport)
│       ├── client.ts           # HTTPS client to hub
│       ├── subscribe.ts        # SSE background subscriber
│       └── tools/
│           ├── send.ts         # comms_send
│           ├── inbox.ts        # comms_inbox
│           ├── online.ts       # comms_online
│           ├── reply.ts        # comms_reply
│           └── status.ts       # comms_status
└── shared/                     # Shared between hub and mcp
    └── crypto/                 # Symlink or import from ../../src/crypto/
```

## Quality Gates

Every PR must pass before merge:

```bash
pnpm check      # TypeScript strict — zero type errors
pnpm test        # Vitest — 100% pass rate
pnpm lint        # Prettier check + ESLint
```

### ESLint Configuration

```jsonc
// .eslintrc.json
{
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "plugins": ["sonarjs"],
  "rules": {
    "sonarjs/cognitive-complexity": ["warn", 15],
    "max-depth": ["warn", 4],
    "no-console": "off"
  }
}
```

Warning ratchet: `eslint --max-warnings=N` where N is current count. New code must not increase N.

### Prettier Configuration

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "semi": true
}
```

## CI Pipeline

GitHub Actions on every push and PR:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: pnpm install --frozen-lockfile
      - run: pnpm check
      - run: pnpm test
      - run: pnpm lint
```

## Conventions

### Commits

Conventional commits: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`

Trailer: `Team: comms-dev`

### Branching

```
main                          # trunk — always deployable
└── story/<issue-id>-description   # short-lived feature branches
```

### File naming

- Source: `kebab-case.ts` (e.g. `sse-manager.ts`)
- Tests: `<module>.test.ts` (e.g. `sse-manager.test.ts`)
- One route per file in `routes/`
- One tool per file in `tools/`

### Error handling

- Validate at system boundaries (HTTP input, MCP tool input)
- Trust internal code and framework guarantees
- Every I/O operation has an error path
- Never swallow errors silently — log with Pino

### Security

- mTLS for all hub connections — no exceptions in v3.0
- E2E encrypt from day one — hub is untrusted for content
- Never log message body content (E2E encrypted, but principle applies)
- Parameterize all SQLite queries
- Rate limit per peer on all endpoints

## References

- [dev-toolkit/CODING_STANDARDS.md](https://github.com/Eesti-Raudtee/dev-toolkit/blob/main/CODING_STANDARDS.md) — base standard
- [dev-toolkit/WORKFLOW.md](https://github.com/Eesti-Raudtee/dev-toolkit/blob/main/WORKFLOW.md) — 8-step process
- [dev-toolkit/ARCHITECTURE.md](https://github.com/Eesti-Raudtee/dev-toolkit/blob/main/ARCHITECTURE.md) — Cloudflare + SvelteKit patterns
- [dev-toolkit/AI_AGENT_BEST_PRACTICES.md](https://github.com/Eesti-Raudtee/dev-toolkit/blob/main/AI_AGENT_BEST_PRACTICES.md) — agent isolation, task decomposition

(*CD:Marconi*)
