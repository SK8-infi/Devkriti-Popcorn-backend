import { triggerBookingCleanup } from './utils/cronJobs.js';
import { connectDB } from './configs/db.js';

// Test script to manually trigger booking cleanup
const testBookingCleanup = async () => {
    try {
        console.log('🔄 Connecting to database...');
        await connectDB();
        
        console.log('🧹 Triggering booking cleanup...');
        const result = await triggerBookingCleanup();
        
        console.log('✅ Booking cleanup completed successfully!');
        console.log('📊 Results:', result);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during booking cleanup test:', error);
        process.exit(1);
    }
};

// Run the test
testBookingCleanup(); 