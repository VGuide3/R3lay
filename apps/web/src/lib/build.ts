import { hashBundleContent, signBundle } from './relay';

export function buildBundle(config: unknown, secret: string) {
  const contentHash = hashBundleContent(config);
  const signature = signBundle(contentHash, secret);
  return { contentHash, signature };
}
