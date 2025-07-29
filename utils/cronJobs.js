import { sendShowReminders } from './emailService.js';

// Store cron intervals
const cronIntervals = new Map();

// Start all cron jobs
export const startCronJobs = () => {
    console.log('Starting cron jobs...');
    
    // Start show reminder cron job (every 8 hours)
    startShowReminderCron();
    
    console.log('All cron jobs started successfully');
};

// Stop all cron jobs
export const stopCronJobs = () => {
    console.log('Stopping all cron jobs...');
    
    cronIntervals.forEach((intervalId, jobName) => {
        clearInterval(intervalId);
        console.log(`Stopped cron job: ${jobName}`);
    });
    
    cronIntervals.clear();
    console.log('All cron jobs stopped');
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
            console.log('Running scheduled show reminders...');
            await sendShowReminders();
        } catch (error) {
            console.error('Error in scheduled show reminder:', error);
        }
    }, interval);
    
    cronIntervals.set(jobName, intervalId);
    console.log(`Started cron job: ${jobName} (every 8 hours)`);
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
        console.log('Manually triggering show reminders...');
        const result = await sendShowReminders();
        console.log('Manual show reminders completed:', result);
        return result;
    } catch (error) {
        console.error('Error in manual show reminder trigger:', error);
        throw error;
    }
}; 