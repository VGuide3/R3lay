export const dnsChecks = {
  pending: 'pending',
  verified: 'verified',
  misconfigured: 'misconfigured',
  conflict: 'conflict',
  failed: 'failed',
} as const;

export type DnsStatus = typeof dnsChecks[keyof typeof dnsChecks];

export function mockDnsVerification(domain: string): { status: DnsStatus; reason?: string } {
  if (domain.includes('localhost')) {
    return { status: 'verified' };
  }

  return { status: 'pending', reason: 'Awaiting DNS record' };
}
