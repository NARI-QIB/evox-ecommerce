// filepath: backend/utils/redisClient.js
const redis = require('redis');

let redisClient = null;
let isConnected = false;

try {
  redisClient = redis.createClient({
    url: process.env.REDIS_URI || 'redis://localhost:6379'
  });

  redisClient.on('error', (err) => {
    isConnected = false;
  });

  redisClient.on('connect', () => {
    isConnected = true;
    console.log('✅ Redis In-Memory Cache Connected...');
  });

  redisClient.connect().catch(() => {
    console.warn('⚠️ Redis Server not found on this machine. Running safely in Standalone Mode.');
    isConnected = false;
  });

} catch (error) {
  console.warn('⚠️ Redis initialization bypassed.');
}

const cache = {
  get: async (key) => {
    if (!isConnected || !redisClient) return null;
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (e) { return null; }
  },
  set: async (key, data, expireInSeconds = 3600) => {
    if (!isConnected || !redisClient) return;
    try {
      await redisClient.setEx(key, expireInSeconds, JSON.stringify(data));
    } catch (e) {}
  },
  del: async (key) => {
    if (!isConnected || !redisClient) return;
    try {
      await redisClient.del(key);
    } catch (e) {}
  }
};

// 🌟 تصدير دوال الفحص التي يحتاجها السيرفر
cache.getRawClient = () => redisClient;
cache.isRedisConnected = () => isConnected;

module.exports = cache;