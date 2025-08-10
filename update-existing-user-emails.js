import mongoose from 'mongoose';
import 'dotenv/config';
import User from './models/User.js';

// Dummy email domains
const dummyDomains = ['dummy.com', 'testmail.com', 'fakeemail.org', 'example.net', 'sample.co.in'];

// Generate new dummy email
const generateDummyEmail = (name) => {
  const cleanName = name.toLowerCase().replace(/\s+/g, '');
  const domain = dummyDomains[Math.floor(Math.random() * dummyDomains.length)];
  const randomNum = Math.floor(Math.random() * 1000);
  return `${cleanName}${randomNum}@${domain}`;
};

const updateExistingUserEmails = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}/Popcorn`);
    console.log('Connected to MongoDB\n');

    // Find all users with realistic email domains
    const realisticDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'rediffmail.com'];
    const usersToUpdate = await User.find({
      email: { $regex: realisticDomains.join('|'), $options: 'i' }
    });

    console.log(`Found ${usersToUpdate.length} users with realistic email domains\n`);

    if (usersToUpdate.length === 0) {
      console.log('✅ No users found with realistic email domains!');
      return;
    }

    console.log('🔍 USERS TO UPDATE:');
    console.log('='.repeat(50));
    
    usersToUpdate.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.city}`);
    });

    console.log('\n🔧 UPDATING EMAILS:');
    console.log('='.repeat(50));

    let updatedCount = 0;
    const updatePromises = usersToUpdate.map(async (user) => {
      const newEmail = generateDummyEmail(user.name);
      console.log(`Updating: ${user.email} → ${newEmail}`);
      
      await User.findByIdAndUpdate(user._id, { email: newEmail });
      updatedCount++;
    });

    await Promise.all(updatePromises);

    console.log(`\n✅ Successfully updated ${updatedCount} user emails!\n`);

    // Show updated statistics
    console.log('📊 UPDATED USER STATISTICS:');
    console.log('='.repeat(50));
    
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalOwners = await User.countDocuments({ role: 'owner' });
    const totalNormalUsers = await User.countDocuments({ role: 'user' });
    
    console.log(`Total users in database: ${totalUsers}`);
    console.log(`Total admin users: ${totalAdmins}`);
    console.log(`Total owner users: ${totalOwners}`);
    console.log(`Total normal users: ${totalNormalUsers}`);

    // Show sample of updated users
    console.log('\n📋 SAMPLE OF UPDATED USERS:');
    console.log('='.repeat(50));
    
    const sampleUsers = await User.find({}).limit(10).sort({ updatedAt: -1 });
    sampleUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.city} - ${user.role}`);
    });

    // Check for any remaining realistic emails
    const remainingRealisticEmails = await User.find({
      email: { $regex: realisticDomains.join('|'), $options: 'i' }
    });

    console.log('\n' + '='.repeat(50));
    console.log('✅ VERIFICATION:');
    console.log('='.repeat(50));
    console.log(`Users with realistic emails remaining: ${remainingRealisticEmails.length}`);
    
    if (remainingRealisticEmails.length === 0) {
      console.log('🎉 All user emails have been updated to dummy domains!');
    } else {
      console.log('❌ Some users still have realistic emails:');
      remainingRealisticEmails.forEach(user => {
        console.log(`  - ${user.name}: ${user.email}`);
      });
    }

  } catch (error) {
    console.error('Error updating user emails:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

updateExistingUserEmails();
