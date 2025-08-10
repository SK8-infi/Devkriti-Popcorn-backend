import mongoose from 'mongoose';
import 'dotenv/config';
import User from './models/User.js';

const allowedCities = ["Delhi", "Mumbai", "Gwalior", "Indore", "Pune", "Chennai"];

// Indian names for each city (5 names per city for uniform distribution)
const cityNames = {
  "Delhi": [
    "Aarav Sharma", "Zara Patel", "Vihaan Singh", "Anaya Gupta", "Arjun Kumar"
  ],
  "Mumbai": [
    "Ishaan Mehta", "Kiara Joshi", "Advait Desai", "Mira Shah", "Reyansh Iyer"
  ],
  "Gwalior": [
    "Dhruv Tomar", "Aisha Chauhan", "Krish Sharma", "Riya Verma", "Aryan Goyal"
  ],
  "Indore": [
    "Ved Jain", "Anvi Patel", "Shaurya Gupta", "Myra Malviya", "Rudra Sharma"
  ],
  "Pune": [
    "Aarush Joshi", "Diya Deshmukh", "Vedant Kulkarni", "Aaradhya Gaikwad", "Shaan Patil"
  ],
  "Chennai": [
    "Aditya Kumar", "Saanvi Devi", "Karthik Iyer", "Anika Raman", "Pranav Venkat"
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
  const domains = ['dummy.com', 'testmail.com', 'fakeemail.org', 'example.net', 'sample.co.in'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const randomNum = Math.floor(Math.random() * 1000);
  return `${cleanName}${randomNum}@${domain}`;
};

// Generate random dates within the last 2 years
const generateRandomDate = () => {
  const now = new Date();
  const twoYearsAgo = new Date(now.getTime() - (2 * 365 * 24 * 60 * 60 * 1000));
  const randomTime = twoYearsAgo.getTime() + Math.random() * (now.getTime() - twoYearsAgo.getTime());
  return new Date(randomTime);
};

// Generate random favorites (movie IDs)
const generateFavorites = () => {
  const movieIds = [
    'tt0111161', 'tt0068646', 'tt0468569', 'tt0071562', 'tt0050083',
    'tt0108052', 'tt0167260', 'tt0110912', 'tt0060196', 'tt0109830',
    'tt0133093', 'tt0133093', 'tt0468569', 'tt1375666', 'tt0133093',
    'tt0816692', 'tt0133093', 'tt0468569', 'tt1375666', 'tt0816692'
  ];
  
  const numFavorites = Math.floor(Math.random() * 8); // 0-7 favorites
  const favorites = [];
  
  for (let i = 0; i < numFavorites; i++) {
    const randomMovie = movieIds[Math.floor(Math.random() * movieIds.length)];
    if (!favorites.includes(randomMovie)) {
      favorites.push(randomMovie);
    }
  }
  
  return favorites;
};

const addDummyUsers = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}/Popcorn`);
    console.log('Connected to MongoDB\n');

    const usersToAdd = [];

    // Create 5 users for each city (30 total)
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
          role: 'user', // Normal user, not admin
          isVerified: true,
          favorites: generateFavorites(),
          city: city,
          createdAt: createdAt,
          updatedAt: updatedAt
        };
        
        usersToAdd.push(user);
      });
    });

    console.log(`Creating ${usersToAdd.length} normal users...\n`);

    // Insert all users
    const result = await User.insertMany(usersToAdd);
    
    console.log(`✅ Successfully created ${result.length} normal users!\n`);

    // Display summary by city
    console.log('📊 NORMAL USERS CREATED BY CITY:');
    console.log('='.repeat(50));
    
    allowedCities.forEach(city => {
      const cityUsers = result.filter(user => user.city === city);
      console.log(`\n🏙️  ${city}: ${cityUsers.length} users`);
      cityUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name} (${user.email})`);
        console.log(`     Favorites: ${user.favorites.length} movies`);
      });
    });

    // Show total statistics
    console.log('\n' + '='.repeat(50));
    console.log('📈 TOTAL STATISTICS:');
    console.log('='.repeat(50));
    
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalOwners = await User.countDocuments({ role: 'owner' });
    const totalNormalUsers = await User.countDocuments({ role: 'user' });
    
    console.log(`Total users in database: ${totalUsers}`);
    console.log(`Total admin users: ${totalAdmins}`);
    console.log(`Total owner users: ${totalOwners}`);
    console.log(`Total normal users: ${totalNormalUsers}`);
    
    // City distribution
    console.log('\n🏙️  CITY DISTRIBUTION:');
    for (const city of allowedCities) {
      const cityCount = await User.countDocuments({ city: city });
      console.log(`  ${city}: ${cityCount} users`);
    }

    // Favorites statistics
    console.log('\n🎬 FAVORITES STATISTICS:');
    const usersWithFavorites = result.filter(user => user.favorites.length > 0);
    const totalFavorites = result.reduce((sum, user) => sum + user.favorites.length, 0);
    const avgFavorites = totalFavorites / result.length;
    
    console.log(`Users with favorites: ${usersWithFavorites.length}/${result.length}`);
    console.log(`Total favorites added: ${totalFavorites}`);
    console.log(`Average favorites per user: ${avgFavorites.toFixed(1)}`);

  } catch (error) {
    console.error('Error adding dummy users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

addDummyUsers();
