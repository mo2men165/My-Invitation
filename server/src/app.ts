// server/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { eventStatusService } from './services/eventStatusService';
import { healthCheckService } from './services/healthCheckService';

// Import routes
import authRoutes from './routes/auth';
import cartRoutes from './routes/cart';
import wishlistRoutes from './routes/wishlist';
import compareRoutes from './routes/compare';
import eventsRoutes from './routes/event';
import paymentRoutes from './routes/payment';
import dashboardRoutes from './routes/dashboard';
import adminRoutes from './routes/admin';
import contactRoutes from './routes/contact';
import collaborationRoutes from './routes/collaboration';
import whatsappRoutes from './routes/whatsapp';
import healthRoutes from './routes/health';


const app = express();

// Security middleware
app.use(helmet());

// Log ALL incoming requests BEFORE CORS for debugging
app.use((req, res, next) => {
  logger.info('=== INCOMING REQUEST ===', {
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    contentType: req.headers['content-type'],
    authorization: req.headers.authorization ? 'PRESENT' : 'MISSING',
    userAgent: req.headers['user-agent']
  });
  next();
});

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      logger.info('CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    // Allow your frontend
    if (origin === process.env.FRONTEND_URL) {
      logger.info('CORS: Allowing frontend origin', { origin });
      return callback(null, true);
    }
    
    // Allow Paymob webhook origins
    if (origin && (
      origin.includes('paymob.com') ||
      origin.includes('accept.paymob.com') ||
      origin.includes('ksa.paymob.com')
    )) {
      logger.info('CORS: Allowing Paymob origin', { origin });
      return callback(null, true);
    }
    
    // Block other origins
    logger.error('CORS: BLOCKING request from unauthorized origin', {
      origin,
      expectedOrigin: process.env.FRONTEND_URL
    });
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Logging
app.use(morgan('combined', {
  stream: { write: (message: string) => logger.info(message.trim()) }
}));

// Body parsing with error handling
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Handle JSON parsing errors
app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof SyntaxError && 'body' in err) {
    logger.error('=== JSON PARSING ERROR ===', {
      error: err.message,
      method: req.method,
      path: req.path,
      body: req.body,
      rawBody: err.body
    });
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid JSON format' }
    });
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: {
      eventStatusChecker: eventStatusService.isStatusCheckerRunning()
    }
  });
});

// Debug: Log when routes are being mounted
logger.info('🔧 Mounting routes...');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/health', healthRoutes);



// Catch-all for undefined routes
app.use('/', (req, res) => {
  res.status(404).json({
    success: false,
    error: { 
      message: 'المسار غير موجود',
      path: req.originalUrl 
    }
  });
});

// Error handling
app.use(errorHandler);

/**
 * Initialize services after database connection
 */
export const initializeServices = async (): Promise<void> => {
  try {
    // Start event status checker
    eventStatusService.startStatusChecker();
    
    // Run initial check on startup
    await eventStatusService.updateExpiredEvents();
    
    // Start health check service (self-ping to keep server awake)
    healthCheckService.start();
    
    logger.info('✅ All services initialized successfully');
  } catch (error) {
    logger.error('❌ Error initializing services:', error);
    throw error;
  }
};

export default app;