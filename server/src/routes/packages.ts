// server/src/routes/packages.ts
import { Router, Request, Response } from 'express';
import { PackageImage } from '../models/PackageImage';
import { logger } from '../config/logger';
import { withDB } from '../utils/routeUtils';

const router = Router();

/**
 * GET /api/packages/images
 * Public list of package images (used to render the packages browsing page)
 */
router.get('/images', withDB(async (req: Request, res: Response) => {
  try {
    const images = await PackageImage.find().sort({ createdAt: 1 });

    return res.json({
      success: true,
      data: images.map(img => ({
        id: img._id.toString(),
        name: img.name,
        image: img.image.secure_url,
        packageTier: img.packageTier,
        // tier-tagged designs carry the historical 'package' category sentinel
        // (matched via packageTier, not category, on the client)
        category: img.category || 'package'
      }))
    });
  } catch (error) {
    logger.error('Error fetching package images:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب صور الباقات' }
    });
  }
}));

export default router;
