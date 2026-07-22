// filepath: backend/server.js
require('dotenv').config();
const path = require('path'); 
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');

const connectDB = require('./config/db');
const cache = require('./utils/redisClient'); 

const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes'); 
const orderRoutes = require('./routes/orderRoutes'); 
const uploadRoutes = require('./routes/uploadRoutes'); 
const dashboardRoutes = require('./routes/dashboardRoutes'); 
const chatRoutes = require('./routes/chatRoutes'); 
const categoryRoutes = require('./routes/categoryRoutes'); 
const settingRoutes = require('./routes/settingRoutes');

const { generateCsrfToken, csrfProtection } = require('./middleware/csrfMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { cancelExpiredOrders } = require('./services/orderService');

const app = express();
app.set('trust proxy', 1); 

connectDB();

app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
  credentials: true, 
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize());

// 🌟 الحماية الشاملة (Bulletproof Fallback): 
// السيرفر لن ينهار إذا لم تكن الحزم مثبتة، بل سيتجاوزها ويعمل بشكل طبيعي
let RedisStore;
try {
  const m = require('rate-limit-redis');
  RedisStore = m.RedisStore || m.default || m;
} catch (error) {
  console.warn("⚠️ 'rate-limit-redis' is not installed. Falling back to MemoryStore.");
}

const getRedisStore = () => {
  if (RedisStore && typeof cache.isRedisConnected === 'function' && cache.isRedisConnected() && cache.getRawClient()) {
    try {
      return new RedisStore({
        sendCommand: (...args) => cache.getRawClient().sendCommand(args)
      });
    } catch (e) { return undefined; }
  }
  return undefined; 
};

const apiLimiter = rateLimit({ store: getRedisStore(), windowMs: 15 * 60 * 1000, max: 300, message: { message: 'Too many requests from this IP, please try again after 15 minutes.' }});
const authLimiter = rateLimit({ store: getRedisStore(), windowMs: 60 * 60 * 1000, max: 10, message: { message: 'Too many login attempts. Please try again after an hour.' }});
const aiLimiter = rateLimit({ store: getRedisStore(), windowMs: 60 * 1000, max: 5, message: { message: 'AI usage limit reached. Please wait a minute before asking more questions.' }});
const otpLimiter = rateLimit({ store: getRedisStore(), windowMs: 15 * 60 * 1000, max: 5, message: { message: 'Too many verification attempts. Please request a new code.' }});

app.get('/', (req, res) => { res.json({ "message": "Sports Store API Running Securely" }); });
app.get('/api/csrf-token', generateCsrfToken);

app.use('/api/', apiLimiter); 
app.use('/api/', csrfProtection);

app.use('/api/users/login', authLimiter); 
app.use('/api/users/register', authLimiter); 
app.use('/api/users/forgot-password', authLimiter); 
app.use('/api/chat', aiLimiter); 

app.use('/api/users/verify-otp', otpLimiter);
app.use('/api/users/verify-account', otpLimiter);
app.use('/api/users/profile/email/verify', otpLimiter);

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes); 
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes); 
app.use('/api/dashboard', dashboardRoutes); 
app.use('/api/chat', chatRoutes); 
app.use('/api/categories', categoryRoutes); 
app.use('/api/settings', settingRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(notFound);
app.use(errorHandler);

// 🌟 أتمتة المهام (Cron Jobs) مع حماية ضد التوقف
let cron;
try { cron = require('node-cron'); } catch (e) {
  console.warn("⚠️ 'node-cron' is not installed. Background jobs will not run automatically.");
}

if (cron) {
  let retryFailedImageDeletions;
  try { retryFailedImageDeletions = require('./config/cloudinary').retryFailedImageDeletions; } catch(e) {}
  
  cron.schedule('0 * * * *', async () => {
    console.log('⏳ Running Background Cron Jobs...');
    try { await cancelExpiredOrders(); } catch(e){}
    try { if (retryFailedImageDeletions) await retryFailedImageDeletions(); } catch(e){}
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running securely on port ${PORT}`);
});