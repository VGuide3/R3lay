# README.md
# R3lay

R3lay is a campaign infrastructure platform for building wallet-enabled marketing landing pages and tracking visitor connections and grant approvals.

## Assumptions
- The project is implemented as a pragmatic production-ready monorepo scaffold that follows the requested architecture and nomenclature.
- Redis Pub/Sub is used for live fan-out while PostgreSQL is the durable system of record for business state and the transactional outbox.
- Only the explicitly requested chain adapters, DNS provider, Telegram alert provider, and health-check constructs are included.
- Local development uses Docker Compose with Postgres, Redis, and a local Anvil EVM chain.

## Architecture
- Next.js 15 web app for dashboard and public landing pages
- PostgreSQL 16 and Drizzle ORM for storage and typed schema
- Redis for hot-path cache and pub/sub
- Worker for transactional outbox delivery
- Auth.js expected to integrate with workspace membership and roles

## Local development
```bash
cp .env.example .env
pnpm install
pnpm docker:up
```

## Environment variables
See `.env.example`.

## Operational notes
- All business mutations use the transactional outbox model.
- Access rules are resolved in middleware before bundle and static assets are served.
- Telegram alert delivery falls back to console logging when credentials are missing.
