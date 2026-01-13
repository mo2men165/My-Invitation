import { Router, Request, Response } from 'express';
import { Event } from '../models/Event';
import { logger } from '../config/logger';
import { checkJwt, extractUser, requireActiveUser } from '../middleware/auth';
import { Types } from 'mongoose';
import { BillService } from '../services/billService';

const router = Router();

// Apply authentication middleware to all dashboard routes
router.use(checkJwt, extractUser, requireActiveUser);

/**
 * GET /api/dashboard/stats
 * Get user's dashboard statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Get current date for calculations
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calculate start and end of current month
    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    
    // Calculate start and end of previous month
    const startOfPreviousMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfPreviousMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    // Get user's events with necessary fields
    const events = await Event.find({ userId: new Types.ObjectId(userId), approvalStatus: 'approved' })
      .select('status totalPrice guests details.inviteCount details.eventDate paymentCompletedAt createdAt')
      .lean();

    // Calculate statistics
    let totalOrders = 0;
    let totalSpent = 0;
    let totalGuests = 0;
    let upcomingEvents = 0;
    let completedEvents = 0;
    let cancelledEvents = 0;
    
    // Calculate next month date for upcoming events
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    
    // Calculate current month orders and revenue
    let currentMonthOrders = 0;
    let currentMonthRevenue = 0;
    let previousMonthOrders = 0;
    let previousMonthRevenue = 0;

    events.forEach(event => {
      totalOrders++;
      totalSpent += event.totalPrice;
      
      // Calculate total guests (sum of all guests' accompanying counts)
      const eventGuests = event.guests.reduce((sum, guest) => sum + guest.numberOfAccompanyingGuests, 0);
      totalGuests += eventGuests;
      
      // Count events by status
      if (event.status === 'done') completedEvents++;
      if (event.status === 'cancelled') cancelledEvents++;
      
      // Count upcoming events within the next month
      const eventDate = new Date(event.details.eventDate);
      if (eventDate >= now && eventDate <= nextMonth && event.status === 'upcoming') {
        upcomingEvents++;
      }
      
      // Check if event is in current month
      if (event.paymentCompletedAt >= startOfCurrentMonth && event.paymentCompletedAt <= endOfCurrentMonth) {
        currentMonthOrders++;
        currentMonthRevenue += event.totalPrice;
      }
      
      // Check if event is in previous month
      if (event.paymentCompletedAt >= startOfPreviousMonth && event.paymentCompletedAt <= endOfPreviousMonth) {
        previousMonthOrders++;
        previousMonthRevenue += event.totalPrice;
      }
    });

    // Calculate percentage changes
    const monthlyOrdersChange = previousMonthOrders > 0 
      ? Math.round(((currentMonthOrders - previousMonthOrders) / previousMonthOrders) * 100)
      : currentMonthOrders > 0 ? 100 : 0;
      
    const monthlySpentChange = previousMonthRevenue > 0 
      ? Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100)
      : currentMonthRevenue > 0 ? 100 : 0;

    logger.info(`Dashboard stats retrieved by user ${userId}`);

    return res.json({
      success: true,
      data: {
        totalOrders,
        totalSpent,
        totalGuests,
        upcomingEvents,
        completedEvents,
        cancelledEvents,
        monthlyOrdersChange,
        monthlySpentChange
      }
    });

  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب إحصائيات لوحة التحكم' }
    });
  }
});

/**
 * GET /api/dashboard/recent-orders
 * Get user's recent orders
 */
router.get('/recent-orders', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = 5 } = req.query;
    
    // Get user's recent events with populated design info
    const events = await Event.find({ userId: new Types.ObjectId(userId), approvalStatus: 'approved' })
      .sort({ paymentCompletedAt: -1, createdAt: -1 })
      .limit(Number(limit))
      .populate('designId', 'title')
      .lean();

    // Format the response
    const formattedEvents = events.map(event => {
      // Determine status color based on status
      let statusColor = 'gray';
      if (event.status === 'done') statusColor = 'green';
      if (event.status === 'upcoming') statusColor = 'blue';
      if (event.status === 'cancelled') statusColor = 'red';
      
      // Format event name using design title
      const designTitle = (event.designId as any)?.title || 'تصميم';
      const eventName = `حفل ${designTitle}`;
      
      // Calculate total guests
      const totalGuests = event.guests.reduce((sum, guest) => sum + guest.numberOfAccompanyingGuests, 0);
      
      // Format amount with Saudi Riyal
      const formattedAmount = `${event.totalPrice.toLocaleString('ar-SA')} ر.س`;
      
      // Translate status to Arabic
      let statusArabic = '';
      switch (event.status) {
        case 'upcoming': statusArabic = 'قريباً'; break;
        case 'done': statusArabic = 'مكتمل'; break;
        case 'cancelled': statusArabic = 'ملغى'; break;
        default: statusArabic = event.status;
      }
      
      // Format date in Arabic locale using Gregorian calendar
      const eventDate = new Date(event.details.eventDate);
      const formattedDate = eventDate.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        calendar: 'gregory'
      });
      
      return {
        id: event._id.toString(),
        event: eventName,
        date: formattedDate,
        guests: totalGuests,
        status: statusArabic,
        statusColor,
        amount: formattedAmount,
        type: event.packageType,
        packageType: event.packageType
      };
    });

    logger.info(`Recent orders retrieved by user ${userId}, count: ${formattedEvents.length}`);

    return res.json({
      success: true,
      data: formattedEvents
    });

  } catch (error) {
    logger.error('Error fetching recent orders:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب الطلبات الحديثة' }
    });
  }
});

/**
 * GET /api/dashboard/bills
 * Get user's bills
 */
router.get('/bills', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = 20, page = 1 } = req.query;

    const result = await BillService.getUserBills(
      userId,
      Number(limit),
      Number(page)
    );

    logger.info(`Bills retrieved for user ${userId}, count: ${result.bills.length}`);

    return res.json({
      success: true,
      data: {
        bills: result.bills,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / Number(limit))
        }
      }
    });

  } catch (error: any) {
    logger.error('Error fetching bills:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب الفواتير' }
    });
  }
});

/**
 * GET /api/dashboard/bills/:billId
 * Get a specific bill by ID
 */
router.get('/bills/:billId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const billId = Array.isArray(req.params.billId) ? req.params.billId[0] : req.params.billId;

    const bill = await BillService.getBillById(billId, userId);

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: { message: 'الفاتورة غير موجودة' }
      });
    }

    logger.info(`Bill retrieved for user ${userId}, billId: ${billId}`);

    return res.json({
      success: true,
      data: bill
    });

  } catch (error: any) {
    logger.error('Error fetching bill:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'خطأ في جلب الفاتورة' }
    });
  }
});

export default router;