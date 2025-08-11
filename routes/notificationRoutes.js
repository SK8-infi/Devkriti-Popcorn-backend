import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
} from '../controllers/notificationController.js';

const notificationRouter = express.Router();

// All routes require authentication
notificationRouter.use(authenticateToken);

// Get user notifications
notificationRouter.get('/', getNotifications);

// Mark notification as read
notificationRouter.patch('/:notificationId/read', markAsRead);

// Mark all notifications as read
notificationRouter.patch('/mark-all-read', markAllAsRead);

// Get unread notification count
notificationRouter.get('/unread-count', getUnreadCount);

export default notificationRouter;
