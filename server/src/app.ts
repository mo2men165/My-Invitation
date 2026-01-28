// server/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';

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


const app = express();

// Security middleware
app.use(helmet());

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Allow your frontend
    if (origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    
    // Allow Paymob webhook origins
    if (origin && (
      origin.includes('paymob.com') ||
      origin.includes('accept.paymob.com') ||
      origin.includes('ksa.paymob.com')
    )) {
      return callback(null, true);
    }
    
    // Block other origins
    logger.warn('CORS blocked:', { origin });
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
    logger.warn('Invalid JSON in request:', { path: req.path });
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
    timestamp: new Date().toISOString()
  });
});

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

export default app;
