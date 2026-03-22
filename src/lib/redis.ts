import { createClient } from 'redis';

const globalForRedis = global as unknown as { redisClient: ReturnType<typeof createClient> };

export const redisClient =
  globalForRedis.redisClient ||
  createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

if (process.env.NODE_ENV !== 'production') globalForRedis.redisClient = redisClient;

// 최초 연결 시도
(async () => {
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
      console.log('✅ Redis Connected');
    } catch (e) {
      console.error('Redis connection error:', e);
    }
  }
})();

export async function publishToExperts(message: string) {
  try {
    if (!redisClient.isOpen) await redisClient.connect();
    // 'expert_notifications' 채널로 메시지 발행
    await redisClient.publish('expert_notifications', message);
    console.log(`[Redis] 전문가 알림 발행 완료: ${message}`);
  } catch (error) {
    console.error('Redis publish error:', error);
  }
}
