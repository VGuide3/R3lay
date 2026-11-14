export async function getRedisClient() {
  const { createClient } = await import('redis');
  return createClient({ url: process.env.REDIS_URL ?? 'redis://localhost:6379' });
}
