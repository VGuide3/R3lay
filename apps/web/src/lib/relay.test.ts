import { describe, expect, it } from 'vitest';
import { hashBundleContent, signBundle, verifyBundleSignature } from './apps/web/src/lib/relay';

describe('bundle hashing', () => {
  it('creates deterministic content hashes', () => {
    const config = { name: 'Campaign', slug: 'campaign', enabledChains: ['evm'], assets: [] };
    expect(hashBundleContent(config)).toEqual(hashBundleContent(config));
  });

  it('verifies bundle signatures', () => {
    const secret = 'secret';
    const contentHash = 'abc';
    const signature = signBundle(contentHash, secret);
    expect(verifyBundleSignature(contentHash, signature, secret)).toBe(true);
  });
});
