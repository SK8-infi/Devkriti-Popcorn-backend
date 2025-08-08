import { sendShowReminders } from './emailService.js';
import Booking from '../models/Booking.js';

// Store cron intervals
const cronIntervals = new Map();

// Start all cron jobs
export const startCronJobs = () => {
    // Start show reminder cron job (every 8 hours)
    startShowReminderCron();
    
    // Start booking cleanup cron job (every 5 minutes)
    startBookingCleanupCron();
};

// Stop all cron jobs
export const stopCronJobs = () => {
    cronIntervals.forEach((intervalId, jobName) => {
        clearInterval(intervalId);
    });
    
    cronIntervals.clear();
};

// Show reminder cron job (runs every 8 hours)
const startShowReminderCron = () => {
    const jobName = 'showReminders';
    const interval = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    
    // Run immediately on startup
    sendShowReminders().catch(error => {
        console.error('Error in initial show reminder run:', error);
    });
    
    // Set up recurring job
    const intervalId = setInterval(async () => {
        try {
            await sendShowReminders();
        } catch (error) {
            console.error('Error in scheduled show reminder:', error);
        }
    }, interval);
    
    cronIntervals.set(jobName, intervalId);
};

// Booking cleanup cron job (runs every 5 minutes)
const startBookingCleanupCron = () => {
    const jobName = 'bookingCleanup';
    const interval = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    // Run immediately on startup
    console.log('🧹 Starting initial booking cleanup...');
    cleanupExpiredBookings().catch(error => {
        console.error('Error in initial booking cleanup run:', error);
    });
    
    // Set up recurring job
    const intervalId = setInterval(async () => {
        try {
            await cleanupExpiredBookings();
        } catch (error) {
            console.error('Error in scheduled booking cleanup:', error);
        }
    }, interval);
    
    cronIntervals.set(jobName, intervalId);
};

// Cleanup expired unpaid bookings
const cleanupExpiredBookings = async () => {
    try {
        const thirtyMinutesAgo = new Date(Date.now() - (30 * 60 * 1000));
        
        // Find and delete unpaid bookings older than 30 minutes
        const result = await Booking.deleteMany({
            isPaid: false,
            createdAt: { $lt: thirtyMinutesAgo }
        });
        
        if (result.deletedCount > 0) {
            console.log(`🧹 Cleaned up ${result.deletedCount} expired unpaid bookings`);
        } else {
            console.log('🧹 No expired bookings found to clean up');
        }
        
        return {
            success: true,
            deletedCount: result.deletedCount,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error cleaning up expired bookings:', error);
        throw error;
    }
};

// Get status of all cron jobs
export const getCronJobStatus = () => {
    const jobs = [];
    cronIntervals.forEach((intervalId, jobName) => {
        jobs.push({
            name: jobName,
            active: true,
            intervalId: intervalId
        });
    });
    return jobs;
};

// Manual trigger for show reminders (for testing)
export const triggerShowReminders = async () => {
    try {
        const result = await sendShowReminders();
        return result;
    } catch (error) {
        console.error('Error in manual show reminder trigger:', error);
        throw error;
    }
};

// Manual trigger for booking cleanup (for testing)
export const triggerBookingCleanup = async () => {
    try {
        const result = await cleanupExpiredBookings();
        return result;
    } catch (error) {
        console.error('Error in manual booking cleanup trigger:', error);
        throw error;
    }
}; 