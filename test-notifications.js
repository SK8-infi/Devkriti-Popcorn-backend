import mongoose from 'mongoose';
import 'dotenv/config';
import { createNotification, createBookingNotification, createShowReminderNotification, createNewShowNotification, createCancellationNotification, createPaymentSuccessNotification, createPaymentFailureNotification } from './utils/notificationService.js';
import User from './models/User.js';

// Connect to MongoDB
await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ Connected to MongoDB');

try {
  // Get a test user
  const testUser = await User.findOne({});
  
  if (!testUser) {
    console.log('❌ No users found in database. Please create a user first.');
    process.exit(1);
  }

  console.log(`👤 Using test user: ${testUser.name} (${testUser.email})`);

  // Test creating different types of notifications
  console.log('\n🧪 Testing notification creation...');

  // Test 1: Basic notification
  const basicNotification = await createNotification(
    testUser._id,
    'Test Notification',
    'This is a test notification to verify the system works.',
    'system'
  );
  console.log('✅ Basic notification created:', basicNotification._id);

  // Test 2: Booking notification
  const bookingNotification = await createBookingNotification(
    '507f1f77bcf86cd799439011', // fake booking ID
    testUser._id,
    'Test Movie',
    new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
    ['A1', 'A2']
  );
  console.log('✅ Booking notification created:', bookingNotification._id);

  // Test 3: Show reminder notification
  const reminderNotification = await createShowReminderNotification(
    testUser._id,
    'Test Movie',
    new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours from now
  );
  console.log('✅ Show reminder notification created:', reminderNotification._id);

  // Test 4: New show notification
  const newShowNotification = await createNewShowNotification(
    testUser._id,
    'New Test Movie'
  );
  console.log('✅ New show notification created:', newShowNotification._id);

  // Test 5: Cancellation notification
  const cancellationNotification = await createCancellationNotification(
    testUser._id,
    'Test Movie',
    500
  );
  console.log('✅ Cancellation notification created:', cancellationNotification._id);

  // Test 6: Payment success notification
  const paymentSuccessNotification = await createPaymentSuccessNotification(
    testUser._id,
    'Test Movie',
    1000
  );
  console.log('✅ Payment success notification created:', paymentSuccessNotification._id);

  // Test 7: Payment failure notification
  const paymentFailureNotification = await createPaymentFailureNotification(
    testUser._id,
    'Test Movie'
  );
  console.log('✅ Payment failure notification created:', paymentFailureNotification._id);

  console.log('\n🎉 All notification tests passed!');
  console.log('📱 You can now test the notifications page in the frontend.');

} catch (error) {
  console.error('❌ Test failed:', error);
} finally {
  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
}
