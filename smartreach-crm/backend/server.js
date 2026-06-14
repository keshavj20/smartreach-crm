require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const { defaultLimiter, aiRateLimiter } = require('./middleware/rateLimiter');

const customerRoutes = require('./routes/customers');
const orderRoutes = require('./routes/orders');
const campaignRoutes = require('./routes/campaigns');
const communicationRoutes = require('./routes/communications');
const audienceRoutes = require('./routes/audiences');
const analyticsRoutes = require('./routes/analytics');
const settingsRoutes = require('./routes/settings');
const channelRoutes = require('./routes/channel');
const copilotRoutes = require('./routes/copilot');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(defaultLimiter);

// Routes
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/audiences', audienceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/copilot', copilotRoutes);
app.use('/api', channelRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
});

// Global error handler (must be last)
app.use(errorHandler);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to MongoDB Atlas');
    } else {
      throw new Error('MONGODB_URI not configured');
    }
  } catch (primaryError) {
    console.warn('⚠️ MongoDB Atlas connect failed:', primaryError.message);
    console.warn('⚠️ Falling back to in-memory MongoDB for local backend startup.');

    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('✅ Connected to in-memory MongoDB');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('❌ Backend startup failed:', err.message);
  process.exit(1);
});

module.exports = app;
