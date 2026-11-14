import { createId } from './ids.js';
import { db } from './index.js';
import { campaigns, workspaces, members, alertChannels, accessRules } from './schema.js';

const demoWorkspaceId = '11111111-1111-4111-8111-111111111111';

export const seedDemoData = async () => {
  await db.insert(workspaces).values({
    id: demoWorkspaceId,
    name: 'Demo Workspace',
  }).onConflictDoNothing();

  await db.insert(members).values([
    { id: createId(), workspaceId: demoWorkspaceId, userId: '22222222-2222-4222-8222-222222222222', role: 'owner', status: 'active' },
    { id: createId(), workspaceId: demoWorkspaceId, userId: '33333333-3333-4333-8333-333333333333', role: 'operator', status: 'active' },
    { id: createId(), workspaceId: demoWorkspaceId, userId: '44444444-4444-4444-8444-444444444444', role: 'viewer', status: 'active' },
  ]).onConflictDoNothing();

  const campaignId = createId();
  await db.insert(campaigns).values({
    id: campaignId,
    workspaceId: demoWorkspaceId,
    name: 'Demo Campaign',
    slug: 'demo-campaign',
    status: 'live',
    activeBundleId: null,
  }).onConflictDoNothing();

  await db.insert(alertChannels).values({
    id: createId(),
    workspaceId: demoWorkspaceId,
    kind: 'telegram',
    target: '@demo_alerts',
    subscriptions: { connection: true, grant: true, deployment: true },
  }).onConflictDoNothing();

  await db.insert(accessRules).values({
    id: createId(),
    campaignId,
    type: 'preset',
    value: 'known-crawlers',
    action: 'block',
    fallbackUrl: null,
    priority: 10,
    enabled: true,
    hits: 0,
  }).onConflictDoNothing();
};
