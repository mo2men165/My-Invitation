// services/cacheService.ts
import { getRedisClient } from '../config/redis';
import { logger } from '../config/logger';
import { ICartItem, IWishlistItem, ICompareItem } from '../models/User';

export class CacheService {
  private static readonly CACHE_TTL = 3600; // 1 hour
  private static readonly CACHE_KEYS = {
    USER_CART: (userId: string) => `user:${userId}:cart`,
    USER_WISHLIST: (userId: string) => `user:${userId}:wishlist`,
    USER_COMPARE: (userId: string) => `user:${userId}:compare`,
    USER_DATA: (userId: string) => `user:${userId}:data`
  };

  /**
   * Cache user's cart data
   */
  static async cacheUserCart(userId: string, cart: ICartItem[]): Promise<void> {
    try {
      const redis = getRedisClient();
      const key = this.CACHE_KEYS.USER_CART(userId);
      
      await redis.setEx(key, this.CACHE_TTL, JSON.stringify(cart));
      logger.debug(`Cached cart for user ${userId}`);
    } catch (error) {
      logger.error('Error caching user cart:', error);
      // Don't throw - cache failures shouldn't break the app
    }
  }

  /**
   * Get user's cart from cache
   */
  static async getCachedUserCart(userId: string): Promise<ICartItem[] | null> {
    try {
      const redis = getRedisClient();
      const key = this.CACHE_KEYS.USER_CART(userId);
      
      const cached = await redis.get(key);
      if (!cached) return null;
      
      const cart = JSON.parse(cached) as ICartItem[];
      logger.debug(`Retrieved cached cart for user ${userId}`);
      return cart;
    } catch (error) {
      logger.error('Error getting cached user cart:', error);
      return null;
    }
  }

  /**
   * Cache user's wishlist data
   */
  static async cacheUserWishlist(userId: string, wishlist: IWishlistItem[]): Promise<void> {
    try {
      const redis = getRedisClient();
      const key = this.CACHE_KEYS.USER_WISHLIST(userId);
      
      await redis.setEx(key, this.CACHE_TTL, JSON.stringify(wishlist));
      logger.debug(`Cached wishlist for user ${userId}`);
    } catch (error) {
      logger.error('Error caching user wishlist:', error);
    }
  }

  /**
   * Get user's wishlist from cache
   */
  static async getCachedUserWishlist(userId: string): Promise<IWishlistItem[] | null> {
    try {
      const redis = getRedisClient();
      const key = this.CACHE_KEYS.USER_WISHLIST(userId);
      
      const cached = await redis.get(key);
      if (!cached) return null;
      
      const wishlist = JSON.parse(cached) as IWishlistItem[];
      logger.debug(`Retrieved cached wishlist for user ${userId}`);
      return wishlist;
    } catch (error) {
      logger.error('Error getting cached user wishlist:', error);
      return null;
    }
  }

  /**
   * Cache user's compare list data
   */
  static async cacheUserCompare(userId: string, compareList: ICompareItem[]): Promise<void> {
    try {
      const redis = getRedisClient();
      const key = this.CACHE_KEYS.USER_COMPARE(userId);
      
      await redis.setEx(key, this.CACHE_TTL, JSON.stringify(compareList));
      logger.debug(`Cached compare list for user ${userId}`);
    } catch (error) {
      logger.error('Error caching user compare list:', error);
    }
  }

  /**
   * Get user's compare list from cache
   */
  static async getCachedUserCompare(userId: string): Promise<ICompareItem[] | null> {
    try {
      const redis = getRedisClient();
      const key = this.CACHE_KEYS.USER_COMPARE(userId);
      
      const cached = await redis.get(key);
      if (!cached) return null;
      
      const compareList = JSON.parse(cached) as ICompareItem[];
      logger.debug(`Retrieved cached compare list for user ${userId}`);
      return compareList;
    } catch (error) {
      logger.error('Error getting cached user compare list:', error);
      return null;
    }
  }

  /**
   * Cache all user data at once (more efficient for initial load)
   */
  static async cacheAllUserData(
    userId: string, 
    data: {
      cart: ICartItem[];
      wishlist: IWishlistItem[];
      compareList: ICompareItem[];
    }
  ): Promise<void> {
    try {
      const redis = getRedisClient();
      
      // Use pipeline for better performance
      const pipeline = redis.multi();
      
      pipeline.setEx(
        this.CACHE_KEYS.USER_CART(userId), 
        this.CACHE_TTL, 
        JSON.stringify(data.cart)
      );
      
      pipeline.setEx(
        this.CACHE_KEYS.USER_WISHLIST(userId), 
        this.CACHE_TTL, 
        JSON.stringify(data.wishlist)
      );
      
      pipeline.setEx(
        this.CACHE_KEYS.USER_COMPARE(userId), 
        this.CACHE_TTL, 
        JSON.stringify(data.compareList)
      );
      
      await pipeline.exec();
      logger.debug(`Cached all data for user ${userId}`);
    } catch (error) {
      logger.error('Error caching all user data:', error);
    }
  }

  /**
   * Invalidate user's cache
   */
  static async invalidateUserCache(userId: string): Promise<void> {
    try {
      const redis = getRedisClient();
      
      const keys = [
        this.CACHE_KEYS.USER_CART(userId),
        this.CACHE_KEYS.USER_WISHLIST(userId),
        this.CACHE_KEYS.USER_COMPARE(userId),
        this.CACHE_KEYS.USER_DATA(userId)
      ];
      
      await redis.del(keys);
      logger.debug(`Invalidated cache for user ${userId}`);
    } catch (error) {
      logger.error('Error invalidating user cache:', error);
    }
  }

  /**
   * Invalidate specific cache
   */
  static async invalidateUserCartCache(userId: string): Promise<void> {
    try {
      const redis = getRedisClient();
      await redis.del(this.CACHE_KEYS.USER_CART(userId));
      logger.debug(`Invalidated cart cache for user ${userId}`);
    } catch (error) {
      logger.error('Error invalidating cart cache:', error);
    }
  }

  static async invalidateUserWishlistCache(userId: string): Promise<void> {
    try {
      const redis = getRedisClient();
      await redis.del(this.CACHE_KEYS.USER_WISHLIST(userId));
      logger.debug(`Invalidated wishlist cache for user ${userId}`);
    } catch (error) {
      logger.error('Error invalidating wishlist cache:', error);
    }
  }

  static async invalidateUserCompareCache(userId: string): Promise<void> {
    try {
      const redis = getRedisClient();
      await redis.del(this.CACHE_KEYS.USER_COMPARE(userId));
      logger.debug(`Invalidated compare cache for user ${userId}`);
    } catch (error) {
      logger.error('Error invalidating compare cache:', error);
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  static async getCacheStats(userId: string): Promise<{
    cart: boolean;
    wishlist: boolean;
    compare: boolean;
  }> {
    try {
      const redis = getRedisClient();
      
      const [cartExists, wishlistExists, compareExists] = await Promise.all([
        redis.exists(this.CACHE_KEYS.USER_CART(userId)),
        redis.exists(this.CACHE_KEYS.USER_WISHLIST(userId)),
        redis.exists(this.CACHE_KEYS.USER_COMPARE(userId))
      ]);
      
      return {
        cart: Boolean(cartExists),
        wishlist: Boolean(wishlistExists),
        compare: Boolean(compareExists)
      };
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return { cart: false, wishlist: false, compare: false };
    }
  }
}