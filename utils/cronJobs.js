import { sendShowReminders } from './emailService.js';

// Store cron intervals
const cronIntervals = new Map();

// Start all cron jobs
export const startCronJobs = () => {
    // Start show reminder cron job (every 8 hours)
    startShowReminderCron();
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