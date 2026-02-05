// server/src/services/eventStatusService.ts
import { Event } from '../models/Event';
import { logger } from '../config/logger';
import { connectDatabase } from '../config/database';

/**
 * Calculate the exact end time of an event
 */
export function calculateEventEndTime(eventDate: Date, endTime: string): Date {
  const date = new Date(eventDate);
  const [hours, minutes] = endTime.split(':').map(Number);
  
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Update events that have passed their end time to 'done' status
 * Can be called from cron jobs or serverless functions
 */
export async function updateExpiredEvents(): Promise<void> {
  try {
    // Ensure MongoDB is connected (safe for serverless)
    await connectDatabase();
    
    const now = new Date();
    
    // Find events where end time has passed
    const events = await Event.find({
      status: 'upcoming'
    });

    const eventsToUpdate = [];

    for (const event of events) {
      const eventEndDateTime = calculateEventEndTime(event.details.eventDate, event.details.endTime);
      
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
