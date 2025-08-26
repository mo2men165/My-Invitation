// server/src/services/eventStatusService.ts
import { Event } from '../models/Event';
import { logger } from '../config/logger';
import cron from 'node-cron';

export class EventStatusService {
  private static instance: EventStatusService;
  private isRunning = false;

  private constructor() {}

  public static getInstance(): EventStatusService {
    if (!EventStatusService.instance) {
      EventStatusService.instance = new EventStatusService();
    }
    return EventStatusService.instance;
  }

  /**
   * Start the cron job to check for events that should be marked as done
   */
  public startStatusChecker(): void {
    if (this.isRunning) {
      logger.warn('Event status checker is already running');
      return;
    }

    // Run every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      try {
        await this.updateExpiredEvents();
      } catch (error) {
        logger.error('Error in event status checker:', error);
      }
    });

    this.isRunning = true;
    logger.info('Event status checker started - runs every 15 minutes');
  }

  /**
   * Manual trigger to update expired events
   */
  public async updateExpiredEvents(): Promise<void> {
    try {
      const now = new Date();
      
      // Find events where end time has passed
      const events = await Event.find({
        status: 'upcoming'
      });

      const eventsToUpdate = [];

      for (const event of events) {
        const eventEndDateTime = this.calculateEventEndTime(event.details.eventDate, event.details.endTime);
        
        if (eventEndDateTime < now) {
          eventsToUpdate.push(event._id);
        }
      }

      if (eventsToUpdate.length === 0) {
        logger.debug('No events to update to done status');
        return;
      }

      // Update events to done status
      const updateResult = await Event.updateMany(
        { _id: { $in: eventsToUpdate } },
        { 
          status: 'done',
          updatedAt: now
        }
      );

      logger.info(`Updated ${updateResult.modifiedCount} events to 'done' status`);

      // Log details for monitoring
      const updatedEvents = await Event.find({ _id: { $in: eventsToUpdate } });
      updatedEvents.forEach(event => {
        logger.debug(`Event ${event._id} marked as done - Date: ${event.details.eventDate}, End: ${event.details.endTime}`);
      });

    } catch (error) {
      logger.error('Error updating expired events:', error);
      throw error;
    }
  }

  /**
   * Calculate the exact end time of an event
   */
  private calculateEventEndTime(eventDate: Date, endTime: string): Date {
    const date = new Date(eventDate);
    const [hours, minutes] = endTime.split(':').map(Number);
    
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * Get events that are about to end (within next hour)
   */
  public async getUpcomingEvents(userId?: string): Promise<any[]> {
    try {
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      const events = await Event.find({
        status: 'upcoming',
        ...(userId && { userId })
      }).populate('userId', 'name email phone');

      const upcomingEvents = events.filter(event => {
        const eventEndTime = this.calculateEventEndTime(event.details.eventDate, event.details.endTime);
        return eventEndTime >= now && eventEndTime <= oneHourFromNow;
      });

      return upcomingEvents.sort((a, b) => {
        const aEndTime = this.calculateEventEndTime(a.details.eventDate, a.details.endTime);
        const bEndTime = this.calculateEventEndTime(b.details.eventDate, b.details.endTime);
        return aEndTime.getTime() - bEndTime.getTime();
      });

    } catch (error) {
      logger.error('Error fetching upcoming events:', error);
      throw error;
    }
  }

  /**
   * Stop the status checker
   */
  public stop(): void {
    this.isRunning = false;
    logger.info('Event status checker stopped');
  }

  /**
   * Get status checker state
   */
  public isStatusCheckerRunning(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const eventStatusService = EventStatusService.getInstance();