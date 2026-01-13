// // utils/eventStatusUpdater.ts
// import { Event } from '../models/Event';
// import { logger } from '../config/logger';

// /**
//  * Automatically update event statuses based on endDate
//  * This should be called periodically (e.g., via cron job)
//  */
// export const updateEventStatusesAutomatically = async (): Promise<void> => {
//   try {
//     const now = new Date();
    
//     // Update events where endDate has passed to 'done'
//     const result = await Event.updateMany(
//       {
//         endDate: { $lte: now },
//         status: { $in: ['awaiting_payment', 'paid'] } // Only update events that aren't already done or cancelled
//       },
//       {
//         $set: {
//           status: 'done',
//           updatedAt: now
//         }
//       }
//     );

//     if (result.modifiedCount > 0) {
//       logger.info(`Automatically updated ${result.modifiedCount} events to 'done' status`);
//     }

//   } catch (error) {
//     logger.error('Error in automatic event status update:', error);
//   }
// };

// /**
//  * Get event with automatic status check
//  * This ensures the status is current when fetching an event
//  */
// export const getEventWithCurrentStatus = async (eventId: string) => {
//   const event = await Event.findById(eventId);
//   if (!event) return null;

//   // Check if status needs to be updated
//   if (event.details.endDate && event.details.endDate <= new Date() && 
//       (event.status === 'awaiting_payment' || event.status === 'paid')) {
//     event.status = 'done';
//     await event.save();
//   }

//   return event;
// };