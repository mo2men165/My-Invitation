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

// Import routes
import authRoutes from './routes/auth';
import cartRoutes from './routes/cart';
import wishlistRoutes from './routes/wishlist';
import compareRoutes from './routes/compare';
import eventsRoutes from './routes/event';
import paymentRoutes from './routes/payment';
import dashboardRoutes from './routes/dashboard';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Logging
app.use(morgan('combined', {
  stream: { write: (message: string) => logger.info(message.trim()) }
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

// Debug: List all routes
app.get('/debug/routes', (req, res) => {
  const routes: any[] = [];
  
  const extractRoutes = (stack: any[], prefix = '') => {
    stack.forEach((middleware: any) => {
      if (middleware.route) {
        // Direct route
        const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
        routes.push(`${methods} ${prefix}${middleware.route.path}`);
      } else if (middleware.name === 'router') {
        // Router middleware
        const routerPrefix = middleware.regexp.source
          .replace('\\', '')
          .replace('(?:', '')
          .replace('\\', '')
          .replace('?', '')
          .replace('$', '')
          .replace('^', '');
        
        if (middleware.handle && middleware.handle.stack) {
          extractRoutes(middleware.handle.stack, prefix + routerPrefix);
        }
      }
    });
  };
  
  extractRoutes(app._router.stack, '');
  
  res.json({ 
    routes,
    totalRoutes: routes.length,
    timestamp: new Date().toISOString()
  });
});

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
    
    logger.info('✅ All services initialized successfully');
  } catch (error) {
    logger.error('❌ Error initializing services:', error);
    throw error;
  }
};

export default app;