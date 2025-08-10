import mongoose from 'mongoose';
import 'dotenv/config';
import Booking from './models/Booking.js';
import Show from './models/Show.js';
import User from './models/User.js';
import Theatre from './models/Theatre.js';
import Movie from './models/Movie.js';

// Booking statuses with realistic probabilities (matching Booking model)
const bookingStatuses = {
  confirmed: 0.75,      // 75% of bookings are confirmed (paid)
  pending: 0.15,        // 15% are pending payment
  payment_failed: 0.08, // 8% payment failed
  cancelled: 0.02       // 2% cancelled
};

// Seat selection patterns
const seatSelectionPatterns = {
  single: 0.3,     // 30% single seats
  couple: 0.4,     // 40% 2 seats together
  group: 0.25,     // 25% 3-4 seats together
  large: 0.05      // 5% 5+ seats together
};

// Generate random seat numbers based on room layout
const generateSeats = (roomLayout, numSeats, seatType) => {
  const seats = [];
  const rows = roomLayout.length;
  const cols = roomLayout[0].length;
  
  // Find available seats of the specified type
  const availableSeats = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (roomLayout[row][col] === seatType) {
        availableSeats.push({ row, col });
      }
    }
  }
  
  if (availableSeats.length < numSeats) {
    return null; // Not enough seats available
  }
  
  // Try to find consecutive seats
  if (numSeats > 1) {
    // Sort by row first, then by column
    availableSeats.sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });
    
    // Look for consecutive seats in the same row
    for (let i = 0; i <= availableSeats.length - numSeats; i++) {
      const consecutive = availableSeats.slice(i, i + numSeats);
      if (consecutive.every((seat, index) => 
        seat.row === consecutive[0].row && 
        seat.col === consecutive[0].col + index
      )) {
        return consecutive.map(seat => `${String.fromCharCode(65 + seat.row)}${seat.col + 1}`);
      }
    }
  }
  
  // If no consecutive seats found, take random seats
  const shuffled = availableSeats.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numSeats).map(seat => `${String.fromCharCode(65 + seat.row)}${seat.col + 1}`);
};

// Calculate booking amount based on seats and prices
const calculateAmount = (seats, seatType, show) => {
  const priceMap = {
    2: show.silverPrice,    // Silver seats
    3: show.goldPrice,      // Gold seats
    4: show.premiumPrice    // Premium seats
  };
  
  const pricePerSeat = priceMap[seatType] || show.silverPrice;
  return seats.length * pricePerSeat;
};



// Generate payment date for confirmed bookings
const generatePaymentDate = (bookingDate, status) => {
  if (status !== 'confirmed') return null;
  
  // Payment made 1-30 minutes after booking
  const minutesAfter = Math.random() * 30 + 1;
  return new Date(bookingDate.getTime() + minutesAfter * 60 * 1000);
};

// Generate booking status based on show date and probabilities
const generateBookingStatus = (showDateTime) => {
  const showDate = new Date(showDateTime);
  const now = new Date();
  const timeUntilShow = showDate.getTime() - now.getTime();
  
  // If show is in the past, all bookings should be confirmed or payment_failed
  if (timeUntilShow < 0) {
    return Math.random() < 0.9 ? 'confirmed' : 'payment_failed';
  }
  
  // If show is today, higher chance of pending bookings
  const daysUntilShow = timeUntilShow / (24 * 60 * 60 * 1000);
  if (daysUntilShow < 1) {
    return Math.random() < 0.6 ? 'confirmed' : 'pending';
  }
  
  // Normal distribution for future shows
  const random = Math.random();
  let cumulative = 0;
  
  for (const [status, probability] of Object.entries(bookingStatuses)) {
    cumulative += probability;
    if (random <= cumulative) {
      return status;
    }
  }
  
  return 'confirmed'; // fallback
};

// Generate payment link for confirmed bookings
const generatePaymentLink = (status) => {
  if (status !== 'confirmed') return null;
  return `https://checkout.stripe.com/pay/${Math.random().toString(36).substring(2, 15)}`;
};



const addBookings = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}/Popcorn`);
    console.log('Connected to MongoDB\n');

    // Get all data
    const shows = await Show.find({}).populate('theatre movie');
    const users = await User.find({ role: 'user' });
    const theatres = await Theatre.find({});
    const existingBookings = await Booking.find({});
    
    console.log(`Found ${shows.length} shows, ${users.length} users, ${theatres.length} theatres, ${existingBookings.length} existing bookings\n`);

    if (shows.length === 0 || users.length === 0) {
      console.log('❌ Need both shows and users to create bookings');
      return;
    }

    const bookingsToAdd = [];
    const showUpdates = new Map(); // Track show seat updates

    // Process each show
    shows.forEach(show => {
      console.log(`🎬 Processing show: ${show.movie.title} at ${show.showDateTime.toLocaleString()}`);
      
      // Determine number of bookings for this show (based on show popularity and timing)
      const showDate = new Date(show.showDateTime);
      const now = new Date();
      const daysUntilShow = (showDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
      
      let maxBookings;
      if (daysUntilShow < 0) {
        // Past show - should have bookings
        maxBookings = Math.floor(Math.random() * 15) + 5; // 5-20 bookings
      } else if (daysUntilShow < 1) {
        // Today's show - more bookings
        maxBookings = Math.floor(Math.random() * 25) + 15; // 15-40 bookings
      } else if (daysUntilShow < 7) {
        // This week - moderate bookings
        maxBookings = Math.floor(Math.random() * 20) + 10; // 10-30 bookings
      } else {
        // Future show - fewer bookings
        maxBookings = Math.floor(Math.random() * 15) + 5; // 5-20 bookings
      }
      
      // Get theatre and room info
      const theatre = theatres.find(t => t._id.toString() === show.theatre._id.toString());
      if (!theatre) {
        console.log(`  ⚠️  Theatre not found for show, skipping`);
        return;
      }
      
      const room = theatre.rooms.find(r => r._id.toString() === show.room);
      if (!room) {
        console.log(`  ⚠️  Room not found for show, skipping`);
        return;
      }
      
      // Initialize show seat tracking
      if (!showUpdates.has(show._id.toString())) {
        showUpdates.set(show._id.toString(), {
          showId: show._id,
          occupiedSeats: { ...show.occupiedSeats }
        });
      }
      
      const showUpdate = showUpdates.get(show._id.toString());
      
      // Create bookings for this show
      const numBookings = Math.min(maxBookings, Math.floor(Math.random() * maxBookings) + 1);
      
      for (let i = 0; i < numBookings; i++) {
        // Select random user
        const user = users[Math.floor(Math.random() * users.length)];
        
        // Determine booking size
        const sizeRandom = Math.random();
        let numSeats;
        if (sizeRandom < seatSelectionPatterns.single) {
          numSeats = 1;
        } else if (sizeRandom < seatSelectionPatterns.single + seatSelectionPatterns.couple) {
          numSeats = 2;
        } else if (sizeRandom < seatSelectionPatterns.single + seatSelectionPatterns.couple + seatSelectionPatterns.group) {
          numSeats = Math.floor(Math.random() * 2) + 3; // 3-4 seats
        } else {
          numSeats = Math.floor(Math.random() * 3) + 5; // 5-7 seats
        }
        
        // Determine seat type (2=Silver, 3=Gold, 4=Premium)
        const seatTypeRandom = Math.random();
        let seatType;
        if (seatTypeRandom < 0.6) {
          seatType = 2; // Silver (60%)
        } else if (seatTypeRandom < 0.85) {
          seatType = 3; // Gold (25%)
        } else {
          seatType = 4; // Premium (15%)
        }
        
        // Generate seats
        const seats = generateSeats(room.layout, numSeats, seatType);
        if (!seats) {
          console.log(`    ⚠️  No available seats for booking ${i + 1}, skipping`);
          continue;
        }
        
        // Check if seats are already occupied
        const seatsAlreadyOccupied = seats.some(seat => 
          showUpdate.occupiedSeats[seat] || 
          Object.values(showUpdate.occupiedSeats).some(booking => 
            booking.seats && booking.seats.includes(seat)
          )
        );
        
        if (seatsAlreadyOccupied) {
          console.log(`    ⚠️  Seats already occupied for booking ${i + 1}, skipping`);
          continue;
        }
        
        // Generate booking status
        const status = generateBookingStatus(show.showDateTime);
        
        // Calculate amount
        const amount = calculateAmount(seats, seatType, show);
        
        // Create booking object (matching Booking model schema)
        const booking = {
          user: user._id,
          show: show._id,
          bookedSeats: seats,
          amount: amount,
          isPaid: status === 'confirmed',
          status: status,
          paymentDate: generatePaymentDate(new Date(), status),
          paymentLink: generatePaymentLink(status),
          isCancelled: status === 'cancelled',
          cancellationDate: status === 'cancelled' ? new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000) : null,
          cancellationReason: status === 'cancelled' ? ['Change of plans', 'Emergency', 'Better seats available', 'Movie changed'][Math.floor(Math.random() * 4)] : null,
          refundAmount: status === 'cancelled' ? amount * 0.8 : 0,
          refundPercentage: status === 'cancelled' ? 80 : 0,
          refundStatus: status === 'cancelled' ? 'completed' : 'none',
          refundReference: status === 'cancelled' ? `ref_${Math.random().toString(36).substring(2, 15)}` : null
        };
        
        bookingsToAdd.push(booking);
        
        // Update show's occupied seats
        seats.forEach(seat => {
          showUpdate.occupiedSeats[seat] = {
            bookingId: `booking_${Math.random().toString(36).substring(2, 15)}`,
            status: status,
            seatType: seatType === 2 ? 'silver' : seatType === 3 ? 'gold' : 'premium',
            bookedAt: new Date()
          };
        });
        
        console.log(`    Added booking: ${user.name} - ${seats.length} ${seatType === 2 ? 'silver' : seatType === 3 ? 'gold' : 'premium'} seats (${status}) - ₹${amount}`);
      }
    });

    console.log(`\n🎫 CREATING BOOKINGS...`);
    console.log(`Total bookings to create: ${bookingsToAdd.length}`);

    if (bookingsToAdd.length === 0) {
      console.log('❌ No bookings to create');
      return;
    }

    // Insert bookings in batches
    const batchSize = 20;
    let insertedCount = 0;
    
    for (let i = 0; i < bookingsToAdd.length; i += batchSize) {
      const batch = bookingsToAdd.slice(i, i + batchSize);
      const result = await Booking.insertMany(batch, { ordered: false });
      insertedCount += result.length;
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}: ${result.length} bookings`);
    }

    console.log(`\n🎉 Successfully created ${insertedCount} bookings!`);

    // Update shows with occupied seats
    console.log(`\n🔄 UPDATING SHOW SEATS...`);
    let updatedShows = 0;
    
    for (const [showId, update] of showUpdates) {
      try {
        await Show.findByIdAndUpdate(showId, {
          occupiedSeats: update.occupiedSeats
        });
        updatedShows++;
      } catch (error) {
        console.log(`  ⚠️  Error updating show ${showId}:`, error.message);
      }
    }
    
    console.log(`✅ Updated ${updatedShows} shows with occupied seats`);

    // Statistics
    const totalBookings = await Booking.countDocuments();
    console.log(`\n📊 BOOKING STATISTICS:`);
    console.log(`Total bookings in database: ${totalBookings}`);

    // Status distribution
    console.log('\n📋 BOOKING STATUS DISTRIBUTION:');
    const statusStats = {};
    bookingsToAdd.forEach(booking => {
      const status = booking.status;
      if (!statusStats[status]) {
        statusStats[status] = 0;
      }
      statusStats[status]++;
    });

    Object.entries(statusStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([status, count]) => {
        const percentage = ((count / bookingsToAdd.length) * 100).toFixed(1);
        console.log(`  ${status.toUpperCase()}: ${count} bookings (${percentage}%)`);
      });

    // Seat type distribution
    console.log('\n💺 SEAT TYPE DISTRIBUTION:');
    const seatTypeStats = {};
    bookingsToAdd.forEach(booking => {
      const seatType = booking.seatType;
      if (!seatTypeStats[seatType]) {
        seatTypeStats[seatType] = 0;
      }
      seatTypeStats[seatType]++;
    });

    Object.entries(seatTypeStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([seatType, count]) => {
        const percentage = ((count / bookingsToAdd.length) * 100).toFixed(1);
        console.log(`  ${seatType.toUpperCase()}: ${count} bookings (${percentage}%)`);
      });

    // Booking size distribution
    console.log('\n👥 BOOKING SIZE DISTRIBUTION:');
    const sizeStats = {};
    bookingsToAdd.forEach(booking => {
      const size = booking.bookedSeats.length;
      if (!sizeStats[size]) {
        sizeStats[size] = 0;
      }
      sizeStats[size]++;
    });

    Object.entries(sizeStats)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([size, count]) => {
        const percentage = ((count / bookingsToAdd.length) * 100).toFixed(1);
        console.log(`  ${size} seat(s): ${count} bookings (${percentage}%)`);
      });

    // Revenue analysis
    console.log('\n💰 REVENUE ANALYSIS:');
    const paidBookings = bookingsToAdd.filter(b => b.status === 'confirmed');
    const totalRevenue = paidBookings.reduce((sum, booking) => sum + booking.amount, 0);
    const avgBookingValue = totalRevenue / paidBookings.length;
    
    console.log(`  Total Revenue: ₹${totalRevenue.toLocaleString()}`);
    console.log(`  Average Booking Value: ₹${avgBookingValue.toFixed(2)}`);
    console.log(`  Confirmed Bookings: ${paidBookings.length}`);

    // User booking distribution
    console.log('\n👤 TOP BOOKERS:');
    const userStats = {};
    bookingsToAdd.forEach(booking => {
      const userId = booking.user.toString();
      if (!userStats[userId]) {
        userStats[userId] = { count: 0, totalSpent: 0 };
      }
      userStats[userId].count++;
      if (booking.status === 'confirmed') {
        userStats[userId].totalSpent += booking.amount;
      }
    });

    Object.entries(userStats)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 10)
      .forEach(([userId, stats]) => {
        const user = users.find(u => u._id.toString() === userId);
        if (user) {
          console.log(`  ${user.name}: ${stats.count} bookings, ₹${stats.totalSpent.toLocaleString()} spent`);
        }
      });

    // Show popularity
    console.log('\n🎬 MOST BOOKED SHOWS:');
    const showStats = {};
    bookingsToAdd.forEach(booking => {
      const showId = booking.show.toString();
      if (!showStats[showId]) {
        showStats[showId] = 0;
      }
      showStats[showId]++;
    });

    Object.entries(showStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([showId, count]) => {
        const show = shows.find(s => s._id.toString() === showId);
        if (show) {
          console.log(`  ${show.movie.title}: ${count} bookings`);
        }
      });

  } catch (error) {
    console.error('Error adding bookings:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

addBookings();
