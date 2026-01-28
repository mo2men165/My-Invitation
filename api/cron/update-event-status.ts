import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDatabase } from '../../server/src/config/database';
import { updateExpiredEvents } from '../../server/src/services/eventStatusService';
import { logger } from '../../server/src/config/logger';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify authorization
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Connect to database
    await connectDatabase();

    // Update expired events
    await updateExpiredEvents();

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Cron job update-event-status failed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
