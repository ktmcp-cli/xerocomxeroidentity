# AGENT.md — Xero Identity CLI for AI Agents

## Setup

```bash
xerocomxeroidentity config set --client-id <id> --client-secret <secret>
xerocomxeroidentity auth login
```

## Commands

```bash
xerocomxeroidentity connections list --json
xerocomxeroidentity connections delete <id>
```

Always use `--json` for parsing.
