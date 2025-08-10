import mongoose from 'mongoose';
import 'dotenv/config';
import Theatre from './models/Theatre.js';
import User from './models/User.js';

const readAllTheatres = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(`${process.env.MONGO_URI}/Popcorn`);
        console.log('Connected to MongoDB\n');

        // Get all theatres with all fields and populate admin info
        const allTheatres = await Theatre.find({}).populate('admin', 'name email role').sort({ createdAt: -1 });
        
        console.log(`Total theatres found: ${allTheatres.length}\n`);
        console.log('='.repeat(80));
        
        allTheatres.forEach((theatre, index) => {
            console.log(`\n🎭 THEATRE ${index + 1}:`);
            console.log('='.repeat(50));
            console.log(`ID: ${theatre._id}`);
            console.log(`Name: ${theatre.name}`);
            console.log(`City: ${theatre.city}`);
            console.log(`Address: ${theatre.address || 'Not set'}`);
            console.log(`Admin: ${theatre.admin ? `${theatre.admin.name} (${theatre.admin.email}) - ${theatre.admin.role}` : 'No admin assigned'}`);
            console.log(`Average Rating: ${theatre.averageRating || 0}`);
            console.log(`Review Count: ${theatre.reviewCount || 0}`);
            
            // Layout information
            console.log(`\n🎬 LAYOUT INFO:`);
            if (theatre.layout && theatre.layout.length > 0) {
                console.log(`  Default Layout: ${theatre.layout.length} rows x ${theatre.layout[0]?.length || 0} columns`);
                console.log(`  Layout Preview: ${theatre.layout.slice(0, 3).map(row => row.join('')).join(' | ')}...`);
            } else {
                console.log(`  Default Layout: Not set`);
            }
            
            // Rooms information
            console.log(`\n🏢 ROOMS INFO:`);
            if (theatre.rooms && theatre.rooms.length > 0) {
                console.log(`  Total Rooms: ${theatre.rooms.length}`);
                theatre.rooms.forEach((room, roomIndex) => {
                    console.log(`  Room ${roomIndex + 1}: ${room.name} (${room.type})`);
                    if (room.layout && room.layout.length > 0) {
                        console.log(`    Layout: ${room.layout.length} rows x ${room.layout[0]?.length || 0} columns`);
                    }
                });
            } else {
                console.log(`  Rooms: No rooms configured`);
            }
            
            console.log(`\n📅 TIMESTAMPS:`);
            console.log(`Created: ${theatre.createdAt ? theatre.createdAt.toLocaleString() : 'Not available'}`);
            console.log(`Updated: ${theatre.updatedAt ? theatre.updatedAt.toLocaleString() : 'Not available'}`);
        });

        console.log('\n' + '='.repeat(80));
        console.log('\n📊 SUMMARY STATISTICS:');
        console.log('='.repeat(50));
        
        const cityCounts = {};
        const roomTypeCounts = {};
        const totalRooms = 0;
        const hasAddressCount = 0;
        const hasRoomsCount = 0;
        
        allTheatres.forEach(theatre => {
            // City counts
            cityCounts[theatre.city] = (cityCounts[theatre.city] || 0) + 1;
            
            // Room type counts
            if (theatre.rooms && theatre.rooms.length > 0) {
                theatre.rooms.forEach(room => {
                    roomTypeCounts[room.type] = (roomTypeCounts[room.type] || 0) + 1;
                });
            }
        });

        console.log('\nCity Distribution:');
        if (Object.keys(cityCounts).length > 0) {
            Object.entries(cityCounts).forEach(([city, count]) => {
                console.log(`  ${city}: ${count} theatres`);
            });
        } else {
            console.log('  No theatres found');
        }

        console.log('\nRoom Type Distribution:');
        if (Object.keys(roomTypeCounts).length > 0) {
            Object.entries(roomTypeCounts).forEach(([type, count]) => {
                console.log(`  ${type}: ${count} rooms`);
            });
        } else {
            console.log('  No rooms configured');
        }

        console.log('\nField Completion:');
        console.log(`  Theatres with address: ${allTheatres.filter(t => t.address).length}/${allTheatres.length}`);
        console.log(`  Theatres with rooms: ${allTheatres.filter(t => t.rooms && t.rooms.length > 0).length}/${allTheatres.length}`);
        console.log(`  Theatres with admin: ${allTheatres.filter(t => t.admin).length}/${allTheatres.length}`);
        console.log(`  Theatres with layout: ${allTheatres.filter(t => t.layout && t.layout.length > 0).length}/${allTheatres.length}`);

        // Calculate total rooms
        const totalRoomsCount = allTheatres.reduce((total, theatre) => {
            return total + (theatre.rooms ? theatre.rooms.length : 0);
        }, 0);
        console.log(`  Total rooms across all theatres: ${totalRoomsCount}`);

        // Show sample theatre object structure
        if (allTheatres.length > 0) {
            console.log('\n📋 SAMPLE THEATRE OBJECT STRUCTURE:');
            console.log('='.repeat(60));
            const sampleTheatre = allTheatres[0];
            console.log(JSON.stringify(sampleTheatre.toObject(), null, 2));
        }

    } catch (error) {
        console.error('Error reading theatres:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
};

readAllTheatres(); 