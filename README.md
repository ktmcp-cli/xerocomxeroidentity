> "Six months ago, everyone was talking about MCPs. And I was like, screw MCPs. Every MCP would be better as a CLI."
>
> — [Peter Steinberger](https://twitter.com/steipete), Founder of OpenClaw
> [Watch on YouTube (~2:39:00)](https://www.youtube.com/@lexfridman) | [Lex Fridman Podcast #491](https://lexfridman.com/peter-steinberger/)

# Xero Identity CLI

Production-ready CLI for Xero OAuth 2 Identity Service API. Manage authentication and tenant connections.

## Installation

```bash
npm install -g @ktmcp-cli/xerocomxeroidentity
```

## Setup

```bash
xerocomxeroidentity config set --client-id <id> --client-secret <secret>
xerocomxeroidentity auth login
```

## Commands

```bash
# Connections
xerocomxeroidentity connections list
xerocomxeroidentity connections delete <id>
```

## License

MIT — Part of [KTMCP CLI](https://killthemcp.com)
