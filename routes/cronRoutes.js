import express from 'express';
import { protectAdmin } from '../middleware/auth.js';
import { 
    getCronJobStatus, 
    triggerShowReminders 
} from '../utils/cronJobs.js';

const cronRouter = express.Router();

// Get status of all cron jobs
cronRouter.get('/status', protectAdmin, (req, res) => {
    try {
        const jobs = getCronJobStatus();
        res.json({ success: true, cronJobs: jobs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Manually trigger show reminders
cronRouter.post('/trigger-reminders', protectAdmin, async (req, res) => {
    try {
        const result = await triggerShowReminders();
        res.json({ 
            success: true, 
            message: 'Show reminders triggered successfully',
            result 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default cronRouter; 