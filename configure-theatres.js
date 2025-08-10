import mongoose from 'mongoose';
import 'dotenv/config';
import Theatre from './models/Theatre.js';
import User from './models/User.js';

// Theatre name templates by city
const theatreNameTemplates = {
  "Delhi": [
    "PVR Cinemas", "INOX Cinemas", "Cinepolis", "Fun Cinemas", "M2K Cinemas",
    "Delite Cinema", "Regal Cinema", "Odeon Cinema", "Plaza Cinema", "Rivoli Cinema"
  ],
  "Mumbai": [
    "PVR Cinemas", "INOX Cinemas", "Cinepolis", "Fun Cinemas", "Carnival Cinemas",
    "Metro Cinema", "Liberty Cinema", "Regal Cinema", "Eros Cinema", "Sterling Cinema"
  ],
  "Gwalior": [
    "PVR Cinemas", "INOX Cinemas", "Cinepolis", "Fun Cinemas", "Gayatri Cinemas",
    "Raj Cinema", "Sapna Cinema", "Tara Cinema", "Shree Cinema", "Lakshmi Cinema"
  ],
  "Indore": [
    "PVR Cinemas", "INOX Cinemas", "Cinepolis", "Fun Cinemas", "Raj Cinema",
    "Sapna Cinema", "Tara Cinema", "Shree Cinema", "Lakshmi Cinema", "Ganesh Cinema"
  ],
  "Pune": [
    "PVR Cinemas", "INOX Cinemas", "Cinepolis", "Fun Cinemas", "Carnival Cinemas",
    "City Pride", "E-Square", "Phoenix MarketCity", "Koregaon Park", "FC Road Cinema"
  ],
  "Chennai": [
    "PVR Cinemas", "INOX Cinemas", "Cinepolis", "Fun Cinemas", "Escape Cinemas",
    "Luxe Cinemas", "Palazzo Cinemas", "Express Avenue", "Phoenix MarketCity", "VR Mall"
  ]
};

// Address templates by city
const addressTemplates = {
  "Delhi": [
    "Connaught Place, New Delhi",
    "Khan Market, New Delhi", 
    "Saket, New Delhi",
    "Dwarka, New Delhi",
    "Rohini, New Delhi",
    "Pitampura, New Delhi",
    "Rajouri Garden, New Delhi",
    "Lajpat Nagar, New Delhi",
    "Greater Kailash, New Delhi",
    "Hauz Khas, New Delhi"
  ],
  "Mumbai": [
    "Bandra West, Mumbai",
    "Andheri West, Mumbai",
    "Juhu, Mumbai",
    "Worli, Mumbai",
    "Colaba, Mumbai",
    "BKC, Mumbai",
    "Powai, Mumbai",
    "Thane West, Mumbai",
    "Navi Mumbai, Maharashtra",
    "Vashi, Navi Mumbai"
  ],
  "Gwalior": [
    "City Center, Gwalior",
    "Lashkar, Gwalior",
    "Thatipur, Gwalior",
    "Vijay Nagar, Gwalior",
    "Sindhi Colony, Gwalior",
    "Arera Colony, Gwalior",
    "IIITM Campus, Gwalior",
    "Maharaj Bada, Gwalior",
    "Phool Bagh, Gwalior",
    "Tansen Nagar, Gwalior"
  ],
  "Indore": [
    "Vijay Nagar, Indore",
    "Rajendra Nagar, Indore",
    "Palasia, Indore",
    "MG Road, Indore",
    "Scheme 54, Indore",
    "Scheme 78, Indore",
    "Rajendra Nagar, Indore",
    "Saket, Indore",
    "Tower Square, Indore",
    "Race Course Road, Indore"
  ],
  "Pune": [
    "Koregaon Park, Pune",
    "FC Road, Pune",
    "JM Road, Pune",
    "Kalyani Nagar, Pune",
    "Viman Nagar, Pune",
    "Hinjewadi, Pune",
    "Baner, Pune",
    "Aundh, Pune",
    "Kharadi, Pune",
    "Wakad, Pune"
  ],
  "Chennai": [
    "T Nagar, Chennai",
    "Anna Nagar, Chennai",
    "Adyar, Chennai",
    "Mylapore, Chennai",
    "Velachery, Chennai",
    "OMR, Chennai",
    "Porur, Chennai",
    "Vadapalani, Chennai",
    "Kilpauk, Chennai",
    "Egmore, Chennai"
  ]
};

// Room type configurations
const roomTypes = ["3D", "IMAX", "Normal"];
const roomNames = ["Screen 1", "Screen 2", "Screen 3", "Screen 4", "Screen 5", "Screen 6"];

// Generate random theatre layout with different seat types
const generateTheatreLayout = (rows, cols) => {
  const layout = [];
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      // Create interesting patterns
      if (i === 0 && j < 2) {
        row.push(0); // Not available (aisle)
      } else if (i === 0 && j > cols - 3) {
        row.push(0); // Not available (aisle)
      } else if (i === Math.floor(rows / 2) && (j === 0 || j === cols - 1)) {
        row.push(0); // Center aisle
      } else if (i < 2 && j < 3) {
        row.push(0); // Front corner not available
      } else if (i < 2 && j > cols - 4) {
        row.push(0); // Front corner not available
      } else {
        // Random seat types: 1=available, 2=silver, 3=gold, 4=premium
        const seatType = Math.random() < 0.7 ? 1 : Math.floor(Math.random() * 3) + 2;
        row.push(seatType);
      }
    }
    layout.push(row);
  }
  return layout;
};

// Generate random theatre name
const generateTheatreName = (city) => {
  const templates = theatreNameTemplates[city] || theatreNameTemplates["Delhi"];
  const baseName = templates[Math.floor(Math.random() * templates.length)];
  const suffixes = ["", " Multiplex", " Cineplex", " Cinema", " Theatre"];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return baseName + suffix;
};

// Generate random address
const generateAddress = (city) => {
  const addresses = addressTemplates[city] || addressTemplates["Delhi"];
  return addresses[Math.floor(Math.random() * addresses.length)];
};

// Generate random room layout
const generateRoomLayout = () => {
  const sizes = [
    { rows: 8, cols: 10 },
    { rows: 9, cols: 12 },
    { rows: 10, cols: 15 },
    { rows: 12, cols: 18 },
    { rows: 7, cols: 9 },
    { rows: 11, cols: 14 }
  ];
  const size = sizes[Math.floor(Math.random() * sizes.length)];
  return generateTheatreLayout(size.rows, size.cols);
};

// Generate random dates within the last 6 months
const generateRandomDate = () => {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
  const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
  return new Date(randomTime);
};

const configureTheatres = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}/Popcorn`);
    console.log('Connected to MongoDB\n');

    // Get all admin and owner users
    const adminUsers = await User.find({ role: { $in: ['admin', 'owner'] } });
    console.log(`Found ${adminUsers.length} admin/owner users\n`);

    // Get existing theatres to see which admins already have theatres
    const existingTheatres = await Theatre.find({});
    const adminsWithTheatres = existingTheatres.map(theatre => theatre.admin.toString());
    
    console.log(`Existing theatres: ${existingTheatres.length}`);
    console.log(`Admins with theatres: ${adminsWithTheatres.length}\n`);

    // Find admins who don't have theatres
    const adminsNeedingTheatres = adminUsers.filter(user => 
      !adminsWithTheatres.includes(user._id.toString())
    );

    console.log(`Admins needing theatres: ${adminsNeedingTheatres.length}\n`);

    if (adminsNeedingTheatres.length === 0) {
      console.log('✅ All admins already have theatres configured!');
      return;
    }

    const theatresToAdd = [];

    adminsNeedingTheatres.forEach((admin, index) => {
      const city = admin.city || ["Delhi", "Mumbai", "Gwalior", "Indore", "Pune", "Chennai"][Math.floor(Math.random() * 6)];
      const createdAt = generateRandomDate();
      const updatedAt = new Date(createdAt.getTime() + Math.random() * (Date.now() - createdAt.getTime()));

      // Generate 6 rooms
      const rooms = [];
      for (let i = 0; i < 6; i++) {
        const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
        const roomName = roomNames[i];
        const layout = generateRoomLayout();
        
        rooms.push({
          name: roomName,
          type: roomType,
          layout: layout
        });
      }

      const theatre = {
        name: generateTheatreName(city),
        city: city,
        address: generateAddress(city),
        admin: admin._id,
        averageRating: 0,
        reviewCount: 0,
        layout: generateTheatreLayout(8, 10), // Default layout
        rooms: rooms,
        createdAt: createdAt,
        updatedAt: updatedAt
      };

      theatresToAdd.push(theatre);
    });

    console.log(`Creating ${theatresToAdd.length} theatres...\n`);

    // Insert all theatres
    const result = await Theatre.insertMany(theatresToAdd);
    
    console.log(`✅ Successfully created ${result.length} theatres!\n`);

    // Display summary by city
    console.log('📊 THEATRES CREATED BY CITY:');
    console.log('='.repeat(50));
    
    const cityGroups = {};
    result.forEach(theatre => {
      if (!cityGroups[theatre.city]) {
        cityGroups[theatre.city] = [];
      }
      cityGroups[theatre.city].push(theatre);
    });

    Object.entries(cityGroups).forEach(([city, theatres]) => {
      console.log(`\n🏙️  ${city}: ${theatres.length} theatres`);
      theatres.forEach((theatre, index) => {
        console.log(`  ${index + 1}. ${theatre.name}`);
        console.log(`     Address: ${theatre.address}`);
        console.log(`     Rooms: ${theatre.rooms.length} (${theatre.rooms.map(r => r.type).join(', ')})`);
      });
    });

    // Show total statistics
    console.log('\n' + '='.repeat(50));
    console.log('📈 TOTAL STATISTICS:');
    console.log('='.repeat(50));
    
    const totalTheatres = await Theatre.countDocuments();
    const totalRooms = await Theatre.aggregate([
      { $unwind: '$rooms' },
      { $count: 'total' }
    ]);
    
    console.log(`Total theatres in database: ${totalTheatres}`);
    console.log(`Total rooms across all theatres: ${totalRooms[0]?.total || 0}`);
    
    // City distribution
    console.log('\n🏙️  CITY DISTRIBUTION:');
    const cityStats = await Theatre.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    cityStats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} theatres`);
    });

  } catch (error) {
    console.error('Error configuring theatres:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

configureTheatres();
