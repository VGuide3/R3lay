import { pgTable, uuid, text, jsonb, timestamp, boolean, integer, bigint, primaryKey, uniqueIndex, serial, pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['owner', 'operator', 'viewer']);
export const memberStatusEnum = pgEnum('member_status', ['active', 'invited', 'revoked']);
export const seatStatusEnum = pgEnum('seat_status', ['available', 'assigned', 'revoked']);
export const inviteStatusEnum = pgEnum('invite_status', ['pending', 'accepted', 'revoked', 'expired']);
export const campaignStatusEnum = pgEnum('campaign_status', ['draft', 'live', 'paused', 'archived']);
export const accessRuleTypeEnum = pgEnum('access_rule_type', ['ip', 'cidr', 'asn', 'ua', 'preset']);
export const accessRuleActionEnum = pgEnum('access_rule_action', ['block', 'fallback']);
export const deploymentTlsStateEnum = pgEnum('deployment_tls_state', ['pending', 'issued', 'renewing', 'failed']);
export const deploymentHealthStateEnum = pgEnum('deployment_health_state', ['healthy', 'degraded', 'unhealthy']);
export const chainEnum = pgEnum('chain', ['evm', 'solana', 'tron', 'xrp']);
export const connectionOutcomeEnum = pgEnum('connection_outcome', ['connected', 'permission_requested', 'granted', 'rejected', 'failed']);
export const grantStatusEnum = pgEnum('grant_status', ['pending', 'granted', 'rejected', 'failed']);
export const alertStatusEnum = pgEnum('alert_status', ['pending', 'delivered', 'failed', 'rate_limited']);
export const outboxStatusEnum = pgEnum('outbox_status', ['pending', 'processing', 'delivered', 'failed', 'dead_letter']);
export const actorTypeEnum = pgEnum('actor_type', ['user', 'api_key', 'system']);

export const workspaces = pgTable('workspace', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const members = pgTable('member', {
  id: uuid('id').primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  userId: uuid('user_id').notNull(),
  role: roleEnum('role').notNull(),
  status: memberStatusEnum('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const seats = pgTable('seat', {
  id: uuid('id').primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  userId: uuid('user_id'),
  email: text('email').notNull(),
  status: seatStatusEnum('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),
});

export const invites = pgTable('invite', {
  id: uuid('id').primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  email: text('email').notNull(),
  tokenHash: text('token_hash').notNull(),
  role: roleEnum('role').notNull(),
  status: inviteStatusEnum('status').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const campaigns = pgTable('campaign', {
  id: uuid('id').primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  status: campaignStatusEnum('status').notNull().default('draft'),
  activeBundleId: uuid('active_bundle_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const configVersions = pgTable('config_version', {
  id: uuid('id').primaryKey(),
  campaignId: uuid('campaign_id').notNull(),
  version: integer('version').notNull(),
  chainMap: jsonb('chain_map').notNull(),
  assets: jsonb('assets').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bundles = pgTable('bundle', {
  id: uuid('id').primaryKey(),
  campaignId: uuid('campaign_id').notNull(),
  configVersionId: uuid('config_version_id').notNull(),
  contentHash: text('content_hash').notNull(),
  signature: text('signature').notNull(),
  storageRef: text('storage_ref').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const accessRules = pgTable('access_rule', {
  id: uuid('id').primaryKey(),
  campaignId: uuid('campaign_id').notNull(),
  type: accessRuleTypeEnum('type').notNull(),
  value: text('value').notNull(),
  action: accessRuleActionEnum('action').notNull(),
  fallbackUrl: text('fallback_url'),
  priority: integer('priority').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  hits: bigint('hits', { mode: 'number' }).notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const accessRuleHits = pgTable('access_rule_hit', {
  id: uuid('id').primaryKey(),
  accessRuleId: uuid('access_rule_id').notNull(),
  campaignId: uuid('campaign_id').notNull(),
  decision: accessRuleActionEnum('decision').notNull(),
  requestFingerprint: text('request_fingerprint').notNull(),
  sampled: boolean('sampled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const deployments = pgTable('deployment', {
  id: uuid('id').primaryKey(),
  campaignId: uuid('campaign_id').notNull(),
  domain: text('domain').notNull(),
  tlsState: deploymentTlsStateEnum('tls_state').notNull().default('pending'),
  healthState: deploymentHealthStateEnum('health_state').notNull().default('healthy'),
  lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const connections = pgTable('connection', {
  id: uuid('id').primaryKey(),
  campaignId: uuid('campaign_id').notNull(),
  workspaceId: uuid('workspace_id').notNull(),
  wallet: text('wallet').notNull(),
  chain: chainEnum('chain').notNull(),
  referrer: text('referrer'),
  utm: jsonb('utm').notNull().default({}),
  outcome: connectionOutcomeEnum('outcome').notNull(),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  campaignWalletUnique: uniqueIndex('connection_campaign_wallet_first_seen_unique').on(table.campaignId, table.wallet, table.firstSeenAt),
}));

export const connectionEvents = pgTable('connection_event', {
  id: uuid('id').primaryKey(),
  connectionId: uuid('connection_id').notNull(),
  campaignId: uuid('campaign_id').notNull(),
  workspaceId: uuid('workspace_id').notNull(),
  wallet: text('wallet').notNull(),
  chain: chainEnum('chain').notNull(),
  outcome: connectionOutcomeEnum('outcome').notNull(),
  referrer: text('referrer'),
  utm: jsonb('utm').notNull().default({}),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
});

export const grants = pgTable('grant', {
  id: uuid('id').primaryKey(),
  campaignId: uuid('campaign_id').notNull(),
  connectionId: uuid('connection_id').notNull(),
  assetId: text('asset_id').notNull(),
  chain: chainEnum('chain').notNull(),
  amountRule: jsonb('amount_rule').notNull(),
  status: grantStatusEnum('status').notNull(),
  txRef: text('tx_ref'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const alertChannels = pgTable('alert_channel', {
  id: uuid('id').primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  kind: text('kind').notNull().default('telegram'),
  target: text('target').notNull(),
  subscriptions: jsonb('subscriptions').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const alertDeliveries = pgTable('alert_delivery', {
  id: uuid('id').primaryKey(),
  alertChannelId: uuid('alert_channel_id').notNull(),
  eventId: uuid('event_id').notNull(),
  status: alertStatusEnum('status').notNull().default('pending'),
  attempts: integer('attempts').notNull().default(0),
  lastError: text('last_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
});

export const apiKeys = pgTable('api_key', {
  id: uuid('id').primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  name: text('name').notNull(),
  prefix: text('prefix').notNull(),
  hash: text('hash').notNull(),
  scopes: text('scopes').array().notNull().default([]),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_log', {
  id: uuid('id').primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  actorType: actorTypeEnum('actor_type').notNull(),
  actorId: text('actor_id').notNull(),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id').notNull(),
  ip: text('ip'),
  diff: jsonb('diff').notNull().default({}),
  traceId: text('trace_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const idempotencyRecords = pgTable('idempotency_record', {
  id: uuid('id').primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  key: text('key').notNull(),
  method: text('method').notNull(),
  path: text('path').notNull(),
  requestHash: text('request_hash').notNull(),
  responseStatus: integer('response_status').notNull(),
  responseBody: jsonb('response_body').notNull().default({}),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const outboxEvents = pgTable('outbox_event', {
  id: uuid('id').primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  campaignId: uuid('campaign_id'),
  aggregateType: text('aggregate_type').notNull(),
  aggregateId: uuid('aggregate_id').notNull(),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').notNull().default({}),
  metadata: jsonb('metadata').notNull().default({}),
  status: outboxStatusEnum('status').notNull().default('pending'),
  attempts: integer('attempts').notNull().default(0),
  availableAt: timestamp('available_at', { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  lastError: text('last_error'),
  traceId: text('trace_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable('user', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const accounts = pgTable('account', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
});

export const sessions = pgTable('session', {
  id: uuid('id').primaryKey(),
  sessionToken: text('session_token').notNull(),
  userId: uuid('user_id').notNull(),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable('verification_token', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.identifier, table.token] }),
}));

export const schema = {
  workspaces,
  members,
  seats,
  invites,
  campaigns,
  configVersions,
  bundles,
  accessRules,
  accessRuleHits,
  deployments,
  connections,
  connectionEvents,
  grants,
  alertChannels,
  alertDeliveries,
  apiKeys,
  auditLogs,
  idempotencyRecords,
  outboxEvents,
  users,
  accounts,
  sessions,
  verificationTokens,
};
