# Ask Purdue Hackers

An AI-powered Q&A tool that answers questions about Purdue Hackers using their Notion workspace as a knowledge base. Available as both a web chat interface and a programmatic API.

## How it works

The app syncs Purdue Hackers' Notion workspace into a cached filesystem. When a user asks a question, an AI agent (Claude Sonnet) navigates and searches the filesystem using bash commands to find relevant information, then synthesizes a natural-language answer.

## Stack

- **Framework**: Next.js 16, React 19
- **AI**: Vercel AI SDK v6, Anthropic Claude Sonnet
- **Auth**: Better Auth with Purdue Hackers Passport Auth
- **Database**: Turso (libsql) via Drizzle ORM
- **Notion sync**: AgentFS SDK + bash-tool for filesystem exploration
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Markdown rendering**: streamdown

## Getting started

### Prerequisites

- [Bun](https://bun.sh) runtime
- A Turso database for auth/API keys
- A second Turso database (AgentFS) for the Notion cache
- A Notion API token with access to the Purdue Hackers workspace
- Purdue Hackers ID OAuth credentials

### Environment variables

Create a `.env.local` file:

```
NOTION_API_TOKEN=
AGENTFS_DATABASE_URL=
AGENTFS_AUTH_TOKEN=
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
CRON_SECRET=
BETTER_AUTH_SECRET=
PHACK_CLIENT_ID=
PHACK_CLIENT_SECRET=
NEXT_PUBLIC_APP_URL=
```

### Setup

```bash
bun install
bun run db:generate
bun run db:migrate
bun dev
```

## API

### Web UI

Visit `/` to use the chat interface. Sign in with Purdue Hackers ID for higher rate limits.

### Programmatic API

```bash
curl -X POST https://your-domain/api/query \
  -H "Authorization: Bearer ph_ask_..." \
  -H "Content-Type: application/json" \
  -d '{"prompt": "When is the next hackathon?"}'
```

Returns `{ "result": "..." }`.

### Rate limits

- Anonymous (web UI): 5 requests/hour
- Authenticated: 30 requests/hour
