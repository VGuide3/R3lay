import crypto from 'node:crypto';
import { z } from 'zod';

export const AccessRuleSchema = z.object({
  id: z.string(),
  campaignId: z.string(),
  type: z.enum(['ip', 'cidr', 'asn', 'ua', 'preset']),
  value: z.string(),
  action: z.enum(['block', 'fallback']),
  fallbackUrl: z.string().optional(),
  priority: z.number().int(),
  enabled: z.boolean().default(true),
});

export function requestFingerprint(request: { ip?: string; userAgent?: string; url: string }) {
  return crypto.createHash('sha256').update(JSON.stringify({
    ip: request.ip ?? 'unknown',
    userAgent: request.userAgent ?? 'unknown',
    url: request.url,
  })).digest('hex');
}

export function matchesPreset(value: string) {
  const presets: Record<string, string[]> = {
    'wallet-security-scanners': ['scanner', 'blocklist'],
    'known-crawlers': ['bot', 'crawler', 'spider'],
    'uptime-monitors': ['uptime', 'pingdom'],
    'common-bots': ['bot', 'headless'],
    'headless-browsers': ['headless']
  };

  return presets[value] ?? [];
}
