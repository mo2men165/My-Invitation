// client/src/constants/customDesign.ts
// UI-only sentinel for the "custom design" option (Premium/VIP) — not a real
// uploaded image, so it isn't part of the Cloudinary-backed package images
// and doesn't go through the admin wizard. Appended to the fetched design
// list in packageImagesSlice.ts so existing cart/wishlist/compare lookups
// by id keep working exactly as before the migration.
import { InvitationDesign } from '@/types';

export const customDesignSentinel: InvitationDesign = {
  id: "000000000000000000000001",
  name: 'تصميم مخصص',
  category: 'custom',
  image: '/custom-design.webp',
  isCustom: true,
  availableFor: ['premium', 'vip']
};
