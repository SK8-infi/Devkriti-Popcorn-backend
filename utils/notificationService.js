import Notification from '../models/Notification.js';

// Create a notification for a user
export const createNotification = async (userId, title, message, type = 'system', relatedId = null, relatedModel = null) => {
  try {
    const notification = new Notification({
      user: userId,
      title,
      message,
      type,
      relatedId,
      relatedModel
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Create booking confirmation notification
export const createBookingNotification = async (bookingId, userId, movieTitle, showDateTime, seats) => {
  const title = 'Booking Confirmed!';
  const message = `Your booking for "${movieTitle}" on ${new Date(showDateTime).toLocaleDateString('en-IN')} at ${new Date(showDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} for seats ${seats.join(', ')} has been confirmed.`;
  
  return createNotification(userId, title, message, 'booking', bookingId, 'Booking');
};

// Create show reminder notification
export const createShowReminderNotification = async (userId, movieTitle, showDateTime) => {
  const title = 'Show Reminder';
  const message = `Your movie "${movieTitle}" starts in 8 hours on ${new Date(showDateTime).toLocaleDateString('en-IN')} at ${new Date(showDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}. Don't forget to arrive early!`;
  
  return createNotification(userId, title, message, 'reminder');
};

// Create new show notification
export const createNewShowNotification = async (userId, movieTitle) => {
  const title = 'New Show Added!';
  const message = `A new show "${movieTitle}" has been added to our theatre. Book your tickets now and don't miss out!`;
  
  return createNotification(userId, title, message, 'show');
};

// Create cancellation notification
export const createCancellationNotification = async (userId, movieTitle, refundAmount) => {
  const title = 'Booking Cancelled';
  const message = `Your booking for "${movieTitle}" has been cancelled. Refund amount: ₹${refundAmount}`;
  
  return createNotification(userId, title, message, 'cancellation');
};

// Create payment success notification
export const createPaymentSuccessNotification = async (userId, movieTitle, amount) => {
  const title = 'Payment Successful!';
  const message = `Payment of ₹${amount} for "${movieTitle}" has been processed successfully. Your ticket has been sent to your email.`;
  
  return createNotification(userId, title, message, 'booking');
};

// Create payment failure notification
export const createPaymentFailureNotification = async (userId, movieTitle) => {
  const title = 'Payment Failed';
  const message = `Payment for "${movieTitle}" failed. Your seats have been released. Please try booking again.`;
  
  return createNotification(userId, title, message, 'system');
};

// Get user notifications
export const getUserNotifications = async (userId, limit = 50, skip = 0) => {
  try {
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
    
    return notifications;
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true },
      { new: true }
    );
    
    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );
    
    return result;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({ user: userId, isRead: false });
    return count;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    throw error;
  }
};

// Delete old notifications (older than 30 days)
export const cleanupOldNotifications = async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    const result = await Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
      isRead: true
    });
    
    console.log(`🧹 Cleaned up ${result.deletedCount} old notifications`);
    return result;
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
    throw error;
  }
};
