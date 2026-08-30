import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDatabase } from '../../server/src/config/database';
import { WhatsappService } from '../../server/src/services/whatsappService';
import { logger } from '../../server/src/config/logger';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify authorization
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await connectDatabase();

    const result = await WhatsappService.applyAccompanyingCountDefaults();

    return res.status(200).json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Cron job accompanying-count-defaults failed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
