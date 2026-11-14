Build a complete highly production ready web3 , production-ready web application called Relay.

Relay is campaign infrastructure. A team creates a campaign, Relay generates a
standalone landing bundle, the team attaches its own domain, and Relay reports
on visitor wallet connections and spending-permission grants. It filters
unwanted traffic, sends chat alerts, and manages workspace seats.

Build the entire application in one pass. Do not ask clarifying questions.
Where this specification is silent, choose the most obvious production-safe
default and document it in README.md under “Assumptions.”

Use the terminology below consistently in code, database columns, API routes,
UI copy, logs, and documentation:
campaign, build, bundle, config, connection, grant, access rule, fallback URL,
deployment, seat.

Never use the words “cloaking” or “decoy.”

============================================================
1. STACK AND DELIVERY
============================================================

Use:
- Next.js 15 App Router
- TypeScript strict mode
- Tailwind CSS
- PostgreSQL 16
- Drizzle ORM
- Redis 7
- Docker and docker-compose
- Auth.js / NextAuth v5
- Email magic-link authentication and GitHub OAuth
- Zod for all external input validation
- pnpm workspaces
- Vitest for unit and integration tests
- Playwright for end-to-end tests

Deployment target:
- Docker behind Cloudflare.
- No paid third-party service may be required to run locally.
- Mock Telegram delivery and DNS verification when credentials are absent.
- Provide provider interfaces so production integrations can be added without
  changing domain logic.

The final repository must include:
- Complete source code.
- Database migrations.
- Seed data.
- Docker Compose configuration.
- Environment-variable examples.
- README with setup, architecture, env vars, assumptions, and operational notes.
- Passing TypeScript, lint, and test commands.

============================================================
2. PRODUCT BEHAVIOR
============================================================

A workspace is the tenant boundary. Every resource must belong to exactly one
workspace.

A team member can:
- Create and edit campaigns.
- Create a campaign config.
- Run a build.
- Preview and publish a bundle.
- Roll back to a prior bundle.
- Configure access rules.
- Attach a custom domain.
- View live connection and grant events.
- Configure Telegram alert channels.
- Manage API keys and seats, subject to role permissions.

A visitor can:
- Open a campaign landing page.
- Connect a wallet.
- Request a spending permission for each configured asset.
- See per-asset permission state.
- Be blocked or redirected by an access rule before page assets load.

Relay must:
- Record wallet connections.
- Record permission-grant outcomes.
- Preserve first-touch referrer and UTM attribution.
- Stream live events to the dashboard.
- Send Telegram alerts according to subscriptions.
- Track deployment health.
- Maintain an audit trail for every mutation.

============================================================
3. CANONICAL DOMAIN MODEL
============================================================

Implement the following aggregates and entities. Treat these as the canonical
domain model; do not rename core concepts.

### Workspace aggregate

workspace
- id: UUID
- name: string
- createdAt: timestamp

member
- id: UUID
- workspaceId: UUID
- userId: UUID
- role: owner | operator | viewer
- status: active | invited | revoked
- createdAt: timestamp

seat
- id: UUID
- workspaceId: UUID
- userId: UUID | null
- email: string
- status: available | assigned | revoked
- createdAt: timestamp
- assignedAt: timestamp | null

invite
- id: UUID
- workspaceId: UUID
- email: string
- tokenHash: string
- role: owner | operator | viewer
- status: pending | accepted | revoked | expired
- expiresAt: timestamp
- acceptedAt: timestamp | null
- createdAt: timestamp

Invites must be:
- Single use.
- Expiring.
- Revocable.
- Audit-logged.

### Campaign aggregate

campaign
- id: UUID
- workspaceId: UUID
- name: string
- slug: string
- status: draft | live | paused | archived
- activeBundleId: UUID | null
- createdAt: timestamp
- updatedAt: timestamp

config_version
- id: UUID
- campaignId: UUID
- version: integer
- chainMap: JSONB
- assets: JSONB
- createdAt: timestamp

bundle
- id: UUID
- campaignId: UUID
- configVersionId: UUID
- contentHash: string
- signature: string
- storageRef: string
- createdAt: timestamp

Rules:
- config_version is immutable after creation.
- bundle is immutable after creation.
- Identical canonical config input must produce an identical contentHash.
- A rollback assigns an existing bundle as the campaign’s active bundle.
- Rollback must restore the prior config snapshot; it must not mutate prior
  config versions or bundles.

### Access-control aggregate

access_rule
- id: UUID
- campaignId: UUID
- type: ip | cidr | asn | ua | preset
- value: string
- action: block | fallback
- fallbackUrl: string | null
- priority: integer
- enabled: boolean
- hits: bigint
- createdAt: timestamp
- updatedAt: timestamp

access_rule_hit
- id: UUID
- accessRuleId: UUID
- campaignId: UUID
- decision: block | fallback
- requestFingerprint: string
- sampled: boolean
- createdAt: timestamp

Rules:
- Rules evaluate before any campaign bundle, static asset, or public API route
  is served.
- block returns HTTP 404.
- fallback returns HTTP 302 to the configured fallback URL.
- First matching rule by ascending priority wins.
- Rule changes must become effective within 30 seconds without a redeploy.
- Rule hit counters must be incremented asynchronously or through an atomic
  Redis counter; do not make request latency depend on a synchronous Postgres
  write.
- Maintain a sampled request log for observability.

### Delivery aggregate

deployment
- id: UUID
- campaignId: UUID
- domain: string
- tlsState: pending | issued | renewing | failed
- healthState: healthy | degraded | unhealthy
- lastCheckedAt: timestamp | null
- createdAt: timestamp
- updatedAt: timestamp

Rules:
- One domain may be attached to only one campaign.
- A duplicate-domain request returns a structured conflict error.
- Health checks evaluate page status, asset load, chain RPC availability, and
  TLS state.
- Emit an alert only when healthState transitions, not on every failed check.

### Visitor-event aggregate

connection
- id: UUID
- campaignId: UUID
- workspaceId: UUID
- wallet: string
- chain: evm | solana | tron | xrp
- referrer: string | null
- utm: JSONB
- outcome: connected | permission_requested | granted | rejected | failed
- firstSeenAt: timestamp
- lastSeenAt: timestamp

connection_event
- id: UUID
- connectionId: UUID
- campaignId: UUID
- workspaceId: UUID
- wallet: string
- chain: evm | solana | tron | xrp
- outcome: connected | permission_requested | granted | rejected | failed
- referrer: string | null
- utm: JSONB
- occurredAt: timestamp

grant
- id: UUID
- campaignId: UUID
- connectionId: UUID
- assetId: string
- chain: evm | solana | tron | xrp
- amountRule: JSONB
- status: pending | granted | rejected | failed
- txRef: string | null
- createdAt: timestamp
- updatedAt: timestamp

Rules:
- connection is append-mostly and partitioned monthly by firstSeenAt.
- Deduplicate connections on (campaignId, wallet).
- A repeat connection updates lastSeenAt and outcome; it does not create a new
  connection row.
- Preserve the original referrer and UTM values from first touch.
- connection_event is append-only and is the source for live feed replay and
  analytics.
- On campaign deletion, cascade-delete campaign-owned resources, but retain
  connection and connection_event data for aggregate reporting.

### Notification aggregate

alert_channel
- id: UUID
- workspaceId: UUID
- kind: telegram
- target: string
- subscriptions: JSONB
- createdAt: timestamp
- updatedAt: timestamp

alert_delivery
- id: UUID
- alertChannelId: UUID
- eventId: UUID
- status: pending | delivered | failed | rate_limited
- attempts: integer
- lastError: text | null
- createdAt: timestamp
- deliveredAt: timestamp | null

Rules:
- Telegram alerts are workspace-scoped.
- Each channel has per-event subscriptions.
- Apply a 60-alert-per-minute cap per workspace.
- If TELEGRAM_BOT_TOKEN is absent, log the alert payload to the worker console
  instead of failing the pipeline.

### Platform aggregate

api_key
- id: UUID
- workspaceId: UUID
- name: string
- prefix: string
- hash: string
- scopes: string[]
- lastUsedAt: timestamp | null
- revokedAt: timestamp | null
- createdAt: timestamp

audit_log
- id: UUID
- workspaceId: UUID
- actorType: user | api_key | system
- actorId: string
- action: string
- resourceType: string
- resourceId: string
- ip: string | null
- diff: JSONB
- traceId: string
- createdAt: timestamp

idempotency_record
- id: UUID
- workspaceId: UUID
- key: string
- method: string
- path: string
- requestHash: string
- responseStatus: integer
- responseBody: JSONB
- expiresAt: timestamp
- createdAt: timestamp

============================================================
4. DATABASE AND TRANSACTION STRATEGY
============================================================

Use PostgreSQL as the system of record. Use Drizzle ORM for typed schema
definitions and queries.

### Partitioning

Partition connection and connection_event monthly by their timestamp column.

Example:

CREATE TABLE connection (
  id uuid NOT NULL,
  campaign_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  wallet text NOT NULL,
  chain text NOT NULL,
  referrer text,
  utm jsonb NOT NULL DEFAULT '{}'::jsonb,
  outcome text NOT NULL,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, first_seen_at)
) PARTITION BY RANGE (first_seen_at);

Create partitions for the current and next month at startup and through a
worker job. Add a partition-maintenance job that creates future partitions and
archives or detaches old partitions according to a configurable retention
policy.

### Connection dedupe

Use an atomic upsert:

INSERT INTO connection (...)
VALUES (...)
ON CONFLICT (campaign_id, wallet, first_seen_at)
DO UPDATE SET
  last_seen_at = EXCLUDED.last_seen_at,
  outcome = EXCLUDED.outcome,
  referrer = COALESCE(connection.referrer, EXCLUDED.referrer),
  utm = CASE
    WHEN connection.referrer IS NULL THEN EXCLUDED.utm
    ELSE connection.utm
  END;

The unique constraint must include the partition key:

UNIQUE (campaign_id, wallet, first_seen_at)

A repeat wallet connection must update the existing connection rather than
append a duplicate.

### Transactional outbox

Use a transactional outbox for every business mutation that must trigger an
external or asynchronous side effect.

In the same database transaction:
1. Apply the primary business mutation.
2. Insert an outbox event.
3. Commit.

Never publish directly to Redis, Telegram, email, or another external system
inside the primary transaction.

outbox_event
- id: UUID
- workspaceId: UUID
- campaignId: UUID | null
- aggregateType: string
- aggregateId: UUID
- eventType: string
- payload: JSONB
- metadata: JSONB
- status: pending | processing | delivered | failed | dead_letter
- attempts: integer
- availableAt: timestamp
- processedAt: timestamp | null
- lastError: text | null
- traceId: string
- createdAt: timestamp

Events to publish:
- connection.created
- connection.updated
- grant.requested
- grant.granted
- grant.rejected
- grant.failed
- access_rule.triggered
- deployment.health_changed
- campaign.build_completed
- campaign.rollback_completed
- seat.changed
- invite.created
- invite.revoked

Worker processing:

1. Select a batch of pending events using:
   SELECT ... FROM outbox_event
   WHERE status = 'pending'
     AND available_at <= now()
   ORDER BY created_at
   FOR UPDATE SKIP LOCKED
   LIMIT 25;

2. Mark selected events as processing.
3. Publish each event to Redis Pub/Sub.
4. Send matching Telegram alerts.
5. Mark the event delivered.
6. On retryable failure, increment attempts and set an exponential backoff
   availableAt.
7. After a configurable retry threshold, move the event to dead-letter status.

The outbox ensures that a committed business mutation and its corresponding
event are durable together; workers then perform retryable delivery. Use
Postgres advisory locks for migration leadership or singleton scheduled jobs
where appropriate; transaction-level advisory locks release automatically at
transaction end.

### Idempotency

Every mutating dashboard and API endpoint must accept an Idempotency-Key header.

Store:
- workspaceId
- HTTP method
- route path
- idempotency key
- normalized request hash
- response status
- response body
- expiry timestamp

On replay:
- Return the stored response without executing the mutation again.
- Return 409 Conflict if the same key is reused with a different request body.

============================================================
5. AUTHENTICATION, ROLES, AND TENANCY
============================================================

Implement Auth.js / NextAuth v5 with:
- Email magic-link sign-in.
- GitHub OAuth sign-in.
- Database-backed sessions and verification tokens.
- HttpOnly session cookies.
- SameSite=Lax cookies.
- Secure cookies in production.
- Refresh-token rotation.
- Revocation of a refresh-token family on suspected reuse.

Every request must resolve:
- authenticated actor
- active workspace
- membership role
- API-key scopes, when applicable

Role matrix:

| Role    | Read | Campaign/build/rule/hosting mutations | Team/API-key/alert mutations |
|---------|------|----------------------------------------|------------------------------|
| owner   | Yes  | Yes                                    | Yes                          |
| operator| Yes  | Yes                                    | No                           |
| viewer  | Yes  | No                                     | No                           |

Enforce authorization in the service/API layer, not only in the UI.

Tenant isolation requirements:
- Every Drizzle query must include workspaceId scoping.
- Never trust a client-provided campaignId without verifying workspace ownership.
- Cross-workspace access must return 404 or 403; do not leak resource existence.
- API keys must carry explicit scopes.
- All mutations must create audit-log entries containing actor, IP, action,
  resource, diff, and traceId.

============================================================
6. CAMPAIGN BUILDER AND BUILD PIPELINE
============================================================

The campaign builder must support:
- Campaign name.
- Campaign slug.
- Chain toggles: evm, solana, tron, xrp.
- Target asset list.
- Per-asset amount rules.
- At least one enabled chain.

Asset fields:
- id
- chain
- symbol
- address or mint, where applicable
- decimals
- amount rule: fixed, percentage, or unlimited
- display metadata

Validation:
- At least one chain must be enabled.
- Every asset must belong to an enabled chain.
- EVM assets require a contract address.
- Solana assets require a mint address.
- TRON assets require a contract address.
- XRP assets are accepted but render as unsupported at runtime.
- Amount values must be valid, positive, and compatible with asset decimals.
- Unknown or malformed fields must fail validation with field-level errors.

### Deterministic build

A build must be deterministic.

Canonicalization rules:
- Sort object keys recursively.
- Remove insignificant whitespace.
- Use stable array ordering where order is semantically irrelevant.
- Include the bundle template version in the hash input.
- Exclude generated-at timestamps from the hash input.
- Use SHA-256 for contentHash.
- Use HMAC-SHA256 for bundle signature.

Build flow:
1. Validate config.
2. Persist an immutable config_version.
3. Render the bundle.
4. Compute canonical contentHash.
5. Sign the contentHash.
6. Store bundle artifacts.
7. Create an immutable bundle row.
8. Activate the new bundle.
9. Emit campaign.build_completed through the transactional outbox.

A repeated build with identical config must produce the same contentHash.

### Preview

Provide a signed preview URL that:
- Expires in 24 hours.
- Uses an HMAC signature.
- Does not expose workspace secrets.
- Can render a bundle before production deployment.

### Rollback

Provide one-click rollback:
- Select any prior bundle.
- Set it as the active bundle.
- Restore its config snapshot in the UI.
- Create an audit event.
- Emit campaign.rollback_completed.
- Never mutate the old bundle or config version.

============================================================
7. PUBLIC LANDING BUNDLE
============================================================

Serve public campaign pages at:

/p/[slug]

The public bundle must be a standalone, lightweight web bundle. It must not
include dashboard code, workspace secrets, database identifiers, or privileged
API credentials.

Flow:
1. Visitor opens /p/[slug].
2. Edge middleware evaluates access rules.
3. If blocked, return 404 before serving page assets.
4. If fallback, return 302 to the configured fallback URL.
5. If allowed, verify bundle hash and signature.
6. Render campaign landing page.
7. Visitor connects a wallet.
8. Relay records a connection.
9. Visitor requests a spending permission for each configured asset.
10. Relay records the grant outcome.

Per-asset UI states:
- idle
- pending
- granted
- rejected
- failed

Chain adapters:
- EVM: wagmi and viem; call approve(spender, amount).
- Solana: wallet adapter; implement the appropriate token approval flow.
- TRON: TronLink adapter.
- XRP: stubbed adapter that renders the UI but reports unsupported.

Show the spender address, asset, and requested amount before requesting a
signature. Do not silently request unlimited approval unless the operator
explicitly configured it.

Public event endpoint:

POST /api/public/events

Required validation:
- Verify bundle signature.
- Validate campaign slug.
- Validate wallet format by chain.
- Validate chain against campaign chainMap.
- Validate asset belongs to campaign config.
- Rate-limit by IP and wallet.
- Reject unknown assets and unsupported operations.

============================================================
8. EDGE ACCESS RULES
============================================================

Implement access-rule evaluation in Next.js Edge Middleware.

Supported rule types:
- ip
- cidr
- asn
- ua
- preset

Supported actions:
- block: HTTP 404
- fallback: HTTP 302 to fallbackUrl

Evaluation order:
1. Load campaign by domain or slug.
2. Load versioned rule document from Redis or edge-compatible cache.
3. Evaluate rules in ascending priority.
4. Return the first matching decision.
5. Increment the matching rule’s hit counter asynchronously.
6. Write a sampled access_rule_hit record.
7. Emit access_rule.triggered through the outbox when applicable.

Performance requirements:
- Edge decision p95 under 50 ms.
- No synchronous Postgres query in the hot path.
- No bundle HTML, JavaScript, CSS, font, or public API response may be served
  after a block decision.

Rule freshness:
- Store a versioned rule document in Redis.
- On mutation, increment the campaign rule version.
- Publish a rule-change event.
- Edge cache refreshes within 30 seconds.
- Include a cache-bypass test.

Seed presets:
- wallet-security-scanners
- known-crawlers
- uptime-monitors
- common-bots
- headless-browsers

Presets must include user-agent patterns, CIDR fixtures, and optional ASN
fixtures. ASN matching may use a static local fixture when no external provider
is configured.

============================================================
9. LIVE FEED AND ALERTS
============================================================

Implement Server-Sent Events at:

GET /api/stream/events

Filters:
- campaignId
- chain
- outcome
- event type

Behavior:
- Authenticate dashboard users with Auth.js.
- Authenticate integrations with scoped API keys.
- Subscribe to a Redis Pub/Sub channel scoped by workspaceId.
- Filter events server-side.
- Send heartbeat events every 15 seconds.
- Support Last-Event-ID reconnect.
- Retain a bounded Redis stream buffer for short replay windows.

Telegram alerts:
- Per-workspace alert channel.
- Per-event subscriptions.
- Optional campaign filter.
- 60 alerts per minute per workspace.
- Redis token-bucket rate limiter.
- Retry with exponential backoff.
- Dead-letter failed deliveries after the retry threshold.
- Console-log alerts when Telegram credentials are absent.

============================================================
10. HOSTING, DNS, AND HEALTH
============================================================

Hosting UI and API must support:
- Attach apex domain or subdomain.
- DNS verification.
- Explicit failure reasons.
- TLS state tracking.
- One campaign per domain.
- Health checks.

DNS verification states:
- pending
- verified
- misconfigured
- conflict
- failed

TLS states:
- pending
- issued
- renewing
- failed

Health checks:
- Page status.
- Asset load.
- Chain RPC availability.
- TLS state.

Health transitions:
- One failure: degraded.
- Three consecutive failures: unhealthy.
- Two consecutive successes after degradation: healthy.
- Emit an alert only on state transition.

Local development:
- Use a MockDnsProvider.
- Use a local reverse proxy and self-signed TLS fixture.
- Do not require a paid DNS or certificate service.

============================================================
11. API CONTRACT
============================================================

Expose a versioned REST API at /api/v1.

All dashboard actions must have API parity: the same service layer, validation,
authorization, audit logging, idempotency, and response shape must be used by
both UI actions and API endpoints.

Required endpoints:

Auth:
- POST /api/v1/auth/magic-link
- POST /api/v1/auth/logout

Workspaces and seats:
- GET /api/v1/workspaces
- POST /api/v1/workspaces
- GET /api/v1/workspaces/:id/members
- POST /api/v1/workspaces/:id/invites
- DELETE /api/v1/invites/:id
- PATCH /api/v1/members/:id
- GET /api/v1/workspaces/:id/seats
- POST /api/v1/workspaces/:id/seats
- DELETE /api/v1/seats/:id

Campaigns:
- GET /api/v1/campaigns
- POST /api/v1/campaigns
- GET /api/v1/campaigns/:id
- PATCH /api/v1/campaigns/:id
- DELETE /api/v1/campaigns/:id
- POST /api/v1/campaigns/:id/config-versions
- POST /api/v1/campaigns/:id/builds
- GET /api/v1/campaigns/:id/bundles
- POST /api/v1/campaigns/:id/rollback

Access rules:
- GET /api/v1/campaigns/:id/access-rules
- POST /api/v1/campaigns/:id/access-rules
- PATCH /api/v1/access-rules/:id
- DELETE /api/v1/access-rules/:id

Hosting:
- POST /api/v1/campaigns/:id/deployments
- GET /api/v1/deployments/:id
- POST /api/v1/deployments/:id/verify-dns
- GET /api/v1/deployments/:id/health

Events:
- GET /api/v1/campaigns/:id/events
- GET /api/v1/campaigns/:id/connections
- GET /api/v1/campaigns/:id/grants
- GET /api/stream/events

Alerts and keys:
- GET /api/v1/workspaces/:id/alert-channels
- POST /api/v1/workspaces/:id/alert-channels
- PATCH /api/v1/alert-channels/:id
- DELETE /api/v1/alert-channels/:id
- GET /api/v1/workspaces/:id/api-keys
- POST /api/v1/workspaces/:id/api-keys
- DELETE /api/v1/api-keys/:id

Every error response must use a stable machine-readable structure:

{
  "error": "validation_error",
  "message": "Request failed validation.",
  "traceId": "…",
  "fieldErrors": {
    "assets[0].address": "Required for EVM assets."
  }
}

============================================================
12. NON-FUNCTIONAL REQUIREMENTS
============================================================

Performance:
- Edge access-rule decision p95 under 50 ms.
- Panel API p95 under 300 ms.
- Use indexes for all tenant, campaign, event, and rule lookup paths.
- Use Redis caching for hot campaign/rule lookups.
- Use pagination and cursor-based queries for event feeds.

Reliability:
- No direct external side effect inside a primary database transaction.
- Use transactional outbox for all asynchronous side effects.
- Use retry with exponential backoff and jitter.
- Use dead-letter status after retry exhaustion.
- Make workers horizontally scalable with SKIP LOCKED claiming.

Observability:
- Structured JSON logs.
- Propagate traceId from panel API to edge and worker.
- Include workspaceId, campaignId, actorId, requestId, and route in logs.
- Expose health endpoints for web and worker.
- Track edge latency, API latency, rule hits, event throughput, alert delivery,
  and deployment health.

Security:
- Validate all external input with Zod.
- Use parameterized Drizzle queries.
- Store API keys as salted hashes.
- Sign bundles and verify signatures at serve time.
- Prevent cross-tenant data access at the query layer.
- Use CSRF protection for browser-origin mutations.
- Rate-limit public event ingestion.
- Do not log wallet private keys, secrets, API keys, or full request bodies
  containing sensitive credentials.

============================================================
13. DOCKER COMPOSE AND LOCAL CHAIN
============================================================

docker compose up must start:
- web
- worker
- postgres
- redis
- local EVM chain

Use a local Anvil-based EVM chain for wallet testing.

On startup:
1. Wait for Postgres and Redis health.
2. Run migrations.
3. Run seed data.
4. Start web and worker.

Seed:
- One demo workspace.
- Three users: owner, operator, viewer.
- Two campaigns.
- One deployment on a localhost domain.
- Approximately 200 synthetic connections across chains.
- Varied connection and grant outcomes.
- Three access rules.
- One Telegram alert channel.

Provide demo login buttons:
- Sign in as Owner
- Sign in as Operator
- Sign in as Viewer

Enable these buttons only in development or when ENABLE_DEMO_LOGIN=true.

============================================================
14. TESTS
============================================================

Implement tests for:

- Deterministic build hashing.
- Identical config producing identical contentHash.
- Unsupported asset on disabled chain failing with field-level error.
- Bundle signature verification.
- Tampered bundle rejection.
- Connection dedupe.
- First-touch referrer and UTM preservation.
- Role enforcement through API, not UI only.
- Viewer read-only enforcement.
- Operator inability to manage team resources.
- Access-rule evaluation for ip, cidr, asn, ua, and preset.
- Block action returning 404.
- Fallback action returning 302.
- Rule cache refresh within 30 seconds.
- SSE filtering and reconnect.
- Telegram rate limiting.
- Telegram console fallback when token is absent.
- Domain conflict enforcement.
- Deployment health transition alerting.
- API-key scope enforcement.
- Idempotency replay behavior.
- Tenant isolation.
- Transactional outbox delivery and retry.
- Monthly partition creation and connection upsert behavior.

============================================================
15. DEFINITION OF DONE
============================================================

The implementation is complete only when:

1. docker compose up --build starts the full stack.
2. Migrations and seed data run automatically.
3. Demo login works for owner, operator, and viewer.
4. A user can create a campaign, configure chains and assets, run a build,
   preview the bundle, and activate it.
5. The landing page connects a wallet on the local EVM chain and records a
   connection.
6. The landing page requests an EVM spending permission and records the grant
   outcome.
7. Access rules block or redirect requests end to end.
8. Live feed displays filtered connection and grant events over SSE.
9. Telegram alerts are delivered or console-logged according to configuration.
10. Domain attachment enforces one campaign per domain.
11. Health checks detect and report unhealthy transitions.
12. API keys enforce scopes.
13. Every mutation is idempotent and audit-logged.
14. Tenant isolation is enforced in every query path.
15. tsc, lint, and tests pass.
16. README documents setup, env vars, architecture, assumptions, and local
    development workflow.

Do not create placeholder files, TODO-only modules, fake test passes, or
unfinished features. Implement the complete vertical slice for every requirement.
