import mongoose from 'mongoose';
import 'dotenv/config';
import User from './models/User.js';

const makeFirstUserAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(`${process.env.MONGO_URI}/Popcorn`);
        console.log('Connected to MongoDB');

        // Find the first user
        const firstUser = await User.findOne().sort({ createdAt: 1 });
        
        if (!firstUser) {
            console.log('No users found in the database');
            console.log('Please sign up with an account first, then run this script again');
            return;
        }

        console.log('Found user:', {
            name: firstUser.name,
            email: firstUser.email,
            currentRole: firstUser.role
        });

        // Check if already admin
        if (firstUser.role === 'admin') {
            console.log('User is already an admin');
            return;
        }

        // Make user admin
        firstUser.role = 'admin';
        await firstUser.save();

        console.log('Successfully made user admin:', {
            name: firstUser.name,
            email: firstUser.email,
            newRole: firstUser.role
        });

        console.log('\nAdmin setup complete!');
        console.log('This user can now access the admin panel and manage other users.');

    } catch (error) {
        console.error('Error making user admin:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

// Run the script
makeFirstUserAdmin(); 