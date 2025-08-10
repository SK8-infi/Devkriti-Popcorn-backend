import mongoose from 'mongoose';
import 'dotenv/config';
import User from './models/User.js';

const allowedCities = ["Delhi", "Mumbai", "Gwalior", "Indore", "Pune", "Chennai"];

// Indian names for each city
const cityNames = {
  "Delhi": [
    "Arjun Kapoor", "Priya Sharma", "Rajesh Kumar", "Anjali Singh", "Vikram Malhotra"
  ],
  "Mumbai": [
    "Rahul Desai", "Meera Patel", "Amit Shah", "Kavya Iyer", "Suresh Menon"
  ],
  "Gwalior": [
    "Vikrant Tomar", "Rashmi Sharma", "Prakash Chauhan", "Sunita Verma", "Rajesh Goyal"
  ],
  "Indore": [
    "Amit Jain", "Pooja Sharma", "Rakesh Gupta", "Neha Patel", "Sachin Malviya"
  ],
  "Pune": [
    "Rahul Joshi", "Anita Deshmukh", "Prakash Kulkarni", "Meera Gaikwad", "Vikram Patil"
  ],
  "Chennai": [
    "Arun Kumar", "Lakshmi Devi", "Rajesh Iyer", "Priya Raman", "Suresh Venkat"
  ]
};

// Generate random Google IDs (21 digits)
const generateGoogleId = () => {
  return Math.floor(Math.random() * 900000000000000000000) + 100000000000000000000;
};

// Generate random profile images
const generateProfileImage = (name) => {
  const colors = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD', '98D8C8', 'F7DC6F'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=200&rounded=true`;
};

// Generate random email
const generateEmail = (name) => {
  const cleanName = name.toLowerCase().replace(/\s+/g, '');
  const domains = ['example.com', 'testmail.com', 'dummy.org', 'fakeemail.net', 'sample.co.in'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const randomNum = Math.floor(Math.random() * 1000);
  return `${cleanName}${randomNum}@${domain}`;
};

// Generate random dates within the last 6 months
const generateRandomDate = () => {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
  const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
  return new Date(randomTime);
};

const addAdminUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(`${process.env.MONGO_URI}/Popcorn`);
    console.log('Connected to MongoDB\n');

    const usersToAdd = [];

    // Create 5 admin users for each city
    allowedCities.forEach(city => {
      const names = cityNames[city];
      
      names.forEach((name, index) => {
        const createdAt = generateRandomDate();
        const updatedAt = new Date(createdAt.getTime() + Math.random() * (Date.now() - createdAt.getTime()));
        
        const user = {
          name: name,
          email: generateEmail(name),
          image: generateProfileImage(name),
          googleId: generateGoogleId().toString(),
          role: 'admin',
          isVerified: true,
          favorites: [],
          city: city,
          createdAt: createdAt,
          updatedAt: updatedAt
        };
        
        usersToAdd.push(user);
      });
    });

    console.log(`Creating ${usersToAdd.length} admin users...\n`);

    // Insert all users
    const result = await User.insertMany(usersToAdd);
    
    console.log(`✅ Successfully created ${result.length} admin users!\n`);

    // Display summary by city
    console.log('📊 ADMIN USERS CREATED BY CITY:');
    console.log('='.repeat(50));
    
    allowedCities.forEach(city => {
      const cityUsers = result.filter(user => user.city === city);
      console.log(`\n🏙️  ${city}: ${cityUsers.length} admins`);
      cityUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name} (${user.email})`);
      });
    });

    // Show total statistics
    console.log('\n' + '='.repeat(50));
    console.log('📈 TOTAL STATISTICS:');
    console.log('='.repeat(50));
    
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalOwners = await User.countDocuments({ role: 'owner' });
    const totalRegularUsers = await User.countDocuments({ role: 'user' });
    
    console.log(`Total users in database: ${totalUsers}`);
    console.log(`Total admin users: ${totalAdmins}`);
    console.log(`Total owner users: ${totalOwners}`);
    console.log(`Total regular users: ${totalRegularUsers}`);
    
    // City distribution
    console.log('\n🏙️  CITY DISTRIBUTION:');
    for (const city of allowedCities) {
      const cityCount = await User.countDocuments({ city: city });
      console.log(`  ${city}: ${cityCount} users`);
    }

  } catch (error) {
    console.error('Error adding admin users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

addAdminUsers(); 