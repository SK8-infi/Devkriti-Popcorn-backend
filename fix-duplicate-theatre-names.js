import mongoose from 'mongoose';
import 'dotenv/config';
import Theatre from './models/Theatre.js';

// Additional theatre name templates for variety
const additionalTheatreNames = {
  "Delhi": [
    "Delite Cinema", "Regal Cinema", "Odeon Cinema", "Plaza Cinema", "Rivoli Cinema",
    "Satyam Cinema", "Shiela Cinema", "Uphaar Cinema", "Chanakya Cinema", "Priya Cinema",
    "PVR Select Citywalk", "INOX Ambience Mall", "Cinepolis DLF Place", "Fun Republic",
    "M2K Rohini", "Carnival Cinemas", "MovieTime Cinemas", "Big Cinemas", "Wave Cinemas"
  ],
  "Mumbai": [
    "Metro Cinema", "Liberty Cinema", "Regal Cinema", "Eros Cinema", "Sterling Cinema",
    "Capitol Cinema", "New Excelsior", "Gaiety Galaxy", "Maratha Mandir", "Sangeet Cinema",
    "PVR Phoenix MarketCity", "INOX R City", "Cinepolis Viviana Mall", "Carnival Cinemas",
    "MovieTime Cinemas", "Big Cinemas", "Wave Cinemas", "Fun Republic", "Adlabs Cinemas"
  ],
  "Gwalior": [
    "Raj Cinema", "Sapna Cinema", "Tara Cinema", "Shree Cinema", "Lakshmi Cinema",
    "Ganesh Cinema", "Krishna Cinema", "Radha Cinema", "Sita Cinema", "Ram Cinema",
    "PVR City Center", "INOX DB Mall", "Cinepolis City Center", "Fun Cinemas",
    "Carnival Cinemas", "MovieTime Cinemas", "Big Cinemas", "Wave Cinemas"
  ],
  "Indore": [
    "Raj Cinema", "Sapna Cinema", "Tara Cinema", "Shree Cinema", "Lakshmi Cinema",
    "Ganesh Cinema", "Krishna Cinema", "Radha Cinema", "Sita Cinema", "Ram Cinema",
    "PVR Treasure Island", "INOX C21 Mall", "Cinepolis Treasure Island", "Fun Cinemas",
    "Carnival Cinemas", "MovieTime Cinemas", "Big Cinemas", "Wave Cinemas"
  ],
  "Pune": [
    "City Pride", "E-Square", "Phoenix MarketCity", "Koregaon Park", "FC Road Cinema",
    "JM Road Cinema", "Kalyani Nagar Cinema", "Viman Nagar Cinema", "Hinjewadi Cinema",
    "Baner Cinema", "Aundh Cinema", "Kharadi Cinema", "Wakad Cinema", "Pimpri Cinema",
    "PVR Phoenix MarketCity", "INOX Amanora", "Cinepolis Phoenix MarketCity", "Fun Republic"
  ],
  "Chennai": [
    "Escape Cinemas", "Luxe Cinemas", "Palazzo Cinemas", "Express Avenue", "Phoenix MarketCity",
    "VR Mall", "T Nagar Cinema", "Anna Nagar Cinema", "Adyar Cinema", "Mylapore Cinema",
    "Velachery Cinema", "OMR Cinema", "Porur Cinema", "Vadapalani Cinema", "Kilpauk Cinema",
    "Egmore Cinema", "PVR VR Mall", "INOX Express Avenue", "Cinepolis VR Mall"
  ]
};

// Generate unique theatre name
const generateUniqueTheatreName = (city, existingNames) => {
  const allNames = [
    ...additionalTheatreNames[city] || [],
    ...additionalTheatreNames["Delhi"] // fallback
  ];
  
  const suffixes = ["", " Multiplex", " Cineplex", " Cinema", " Theatre", " Mall", " Plaza"];
  
  for (let attempt = 0; attempt < 100; attempt++) {
    const baseName = allNames[Math.floor(Math.random() * allNames.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const fullName = baseName + suffix;
    
    if (!existingNames.includes(fullName)) {
      return fullName;
    }
  }
  
  // If all attempts fail, add a random number
  const baseName = allNames[Math.floor(Math.random() * allNames.length)];
  const randomNum = Math.floor(Math.random() * 1000);
  return `${baseName} ${randomNum}`;
};

const fixDuplicateTheatreNames = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}/Popcorn`);
    console.log('Connected to MongoDB\n');

    // Get all theatres
    const allTheatres = await Theatre.find({}).sort({ city: 1, name: 1 });
    console.log(`Total theatres found: ${allTheatres.length}\n`);

    // Check for duplicates
    const nameCounts = {};
    const duplicates = [];
    
    allTheatres.forEach(theatre => {
      const name = theatre.name;
      if (!nameCounts[name]) {
        nameCounts[name] = [];
      }
      nameCounts[name].push(theatre);
      
      if (nameCounts[name].length > 1) {
        duplicates.push(name);
      }
    });

    console.log('🔍 DUPLICATE ANALYSIS:');
    console.log('='.repeat(50));
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate theatre names found!');
      return;
    }

    console.log(`Found ${duplicates.length} duplicate names:\n`);
    
    duplicates.forEach(duplicateName => {
      const theatres = nameCounts[duplicateName];
      console.log(`"${duplicateName}" (${theatres.length} theatres):`);
      theatres.forEach((theatre, index) => {
        console.log(`  ${index + 1}. ${theatre.city} - ${theatre.address}`);
      });
      console.log('');
    });

    // Fix duplicates
    console.log('🔧 FIXING DUPLICATES:');
    console.log('='.repeat(50));
    
    const existingNames = allTheatres.map(t => t.name);
    let fixedCount = 0;

    for (const duplicateName of duplicates) {
      const theatres = nameCounts[duplicateName];
      
      // Keep the first one, rename the rest
      for (let i = 1; i < theatres.length; i++) {
        const theatre = theatres[i];
        const newName = generateUniqueTheatreName(theatre.city, existingNames);
        
        console.log(`Renaming: "${theatre.name}" → "${newName}" (${theatre.city})`);
        
        await Theatre.findByIdAndUpdate(theatre._id, { name: newName });
        existingNames.push(newName);
        fixedCount++;
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} duplicate names!\n`);

    // Show final results
    console.log('📊 FINAL THEATRE NAMES BY CITY:');
    console.log('='.repeat(50));
    
    const finalTheatres = await Theatre.find({}).sort({ city: 1, name: 1 });
    const cityGroups = {};
    
    finalTheatres.forEach(theatre => {
      if (!cityGroups[theatre.city]) {
        cityGroups[theatre.city] = [];
      }
      cityGroups[theatre.city].push(theatre);
    });

    Object.entries(cityGroups).forEach(([city, theatres]) => {
      console.log(`\n🏙️  ${city}: ${theatres.length} theatres`);
      theatres.forEach((theatre, index) => {
        console.log(`  ${index + 1}. ${theatre.name}`);
      });
    });

    // Verify no duplicates remain
    const finalNames = finalTheatres.map(t => t.name);
    const uniqueNames = new Set(finalNames);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ VERIFICATION:');
    console.log('='.repeat(50));
    console.log(`Total theatres: ${finalTheatres.length}`);
    console.log(`Unique names: ${uniqueNames.size}`);
    console.log(`Duplicates remaining: ${finalTheatres.length - uniqueNames.size}`);
    
    if (finalTheatres.length === uniqueNames.size) {
      console.log('🎉 All theatre names are now unique!');
    } else {
      console.log('❌ Some duplicates still exist!');
    }

  } catch (error) {
    console.error('Error fixing duplicate theatre names:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

fixDuplicateTheatreNames();
