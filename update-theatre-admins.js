import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Theatre from './models/Theatre.js';
import User from './models/User.js';

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const checkTheatreAdmins = async () => {
    try {
        console.log('\nChecking current theatre admin references...\n');
        
        const theatres = await Theatre.find({});
        
        if (theatres.length === 0) {
            console.log('No theatres found in database');
            return;
        }
        
        console.log(`📊 Found ${theatres.length} theatres:`);
        
        for (const theatre of theatres) {
            console.log(`\n🎭 Theatre: ${theatre.name} (${theatre.city})`);
            console.log(`   Admin ID: ${theatre.admin}`);
            console.log(`   Admin ID Type: ${typeof theatre.admin}`);
            
            // Check if admin ID is a valid MongoDB ObjectId
            const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(theatre.admin);
            console.log(`   Is Valid ObjectId: ${isValidObjectId}`);
            
            if (isValidObjectId) {
                // Try to find user by ObjectId
                const user = await User.findById(theatre.admin);
                if (user) {
                    console.log(`   User found: ${user.name} (${user.email})`);
                    console.log(`   Google ID: ${user.googleId || 'Not set'}`);
                } else {
                    console.log(`   User not found with ObjectId: ${theatre.admin}`);
                }
            } else {
                // Check if it's a Clerk-style ID
                if (theatre.admin.startsWith('user_')) {
                    console.log(`   Clerk-style ID detected: ${theatre.admin}`);
                    
                    // Try to find user by email (if we can guess it)
                    const users = await User.find({});
                    console.log(`   Available users:`);
                    users.forEach(u => {
                        console.log(`      - ${u.name} (${u.email}) - Google ID: ${u.googleId || 'Not set'}`);
                    });
                } else {
                    console.log(`   ❓ Unknown ID format: ${theatre.admin}`);
                }
            }
        }
        
    } catch (error) {
        console.error('Error checking theatre admins:', error);
    }
};

const updateTheatreAdmins = async () => {
    try {
        console.log('\nUpdating theatre admin references...\n');
        
        const theatres = await Theatre.find({});
        let updatedCount = 0;
        
        for (const theatre of theatres) {
            console.log(`\n🎭 Processing: ${theatre.name} (${theatre.city})`);
            
            // Check if admin ID is a valid MongoDB ObjectId
            const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(theatre.admin);
            
            if (isValidObjectId) {
                // Already using MongoDB ObjectId, check if user exists
                const user = await User.findById(theatre.admin);
                if (user) {
                    console.log(`   Already using valid MongoDB ObjectId`);
                    continue;
                } else {
                    console.log(`   User not found, needs update`);
                }
            } else {
                console.log(`   Invalid admin ID format: ${theatre.admin}`);
            }
            
            // Find the first admin user to assign
            const adminUser = await User.findOne({ role: 'admin' });
            
            if (adminUser) {
                theatre.admin = adminUser._id.toString();
                await theatre.save();
                console.log(`   Updated to admin: ${adminUser.name} (${adminUser.email})`);
                updatedCount++;
            } else {
                console.log(`   No admin users found to assign`);
            }
        }
        
        console.log(`\nUpdated ${updatedCount} theatres`);
        
    } catch (error) {
        console.error('Error updating theatre admins:', error);
    }
};

const main = async () => {
    await connectDB();
    
    console.log('Theatre Admin Reference Update Tool\n');
    console.log('1. Check current theatre admin references');
    console.log('2. Update theatre admin references to use Google IDs');
    
    const choice = process.argv[2];
    
    if (choice === 'check') {
        await checkTheatreAdmins();
    } else if (choice === 'update') {
        await updateTheatreAdmins();
    } else {
        console.log('\nUsage:');
        console.log('  node update-theatre-admins.js check  - Check current references');
        console.log('  node update-theatre-admins.js update - Update references');
    }
    
    await mongoose.disconnect();
            console.log('\nDisconnected from MongoDB');
};

main().catch(console.error); 