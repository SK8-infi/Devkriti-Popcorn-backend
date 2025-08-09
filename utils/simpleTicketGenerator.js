import QRCode from 'qrcode';

// Simple text-based ticket generator as fallback when Puppeteer fails
export const generateSimpleTicket = async (bookingData) => {
    try {
        console.log('📝 Generating simple text ticket for booking:', bookingData._id);
        
        // Generate QR code
        const qrData = {
            bookingId: bookingData._id,
            movieTitle: bookingData.show?.movie?.title,
            theatreName: bookingData.show?.theatre?.name,
            showTime: bookingData.show?.showDateTime,
            seats: bookingData.bookedSeats,
            userId: bookingData.user?._id
        };
        
        const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));
        
        // Create simple HTML template
        const simpleHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Movie Ticket</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .ticket { background: white; padding: 30px; border-radius: 10px; max-width: 400px; margin: 0 auto; border: 2px solid #ff6b35; }
        .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 20px; margin-bottom: 20px; }
        .title { color: #ff6b35; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .info { margin-bottom: 15px; }
        .label { font-weight: bold; color: #333; }
        .value { color: #666; }
        .qr-code { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 2px dashed #ccc; }
        .qr-code img { width: 150px; height: 150px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888; }
    </style>
</head>
<body>
    <div class="ticket">
        <div class="header">
            <div class="title">🎬 MOVIE TICKET</div>
            <div style="color: #666;">Devkriti Popcorn</div>
        </div>
        
        <div class="info">
            <span class="label">Movie:</span>
            <span class="value">${bookingData.show?.movie?.title || 'N/A'}</span>
        </div>
        
        <div class="info">
            <span class="label">Theatre:</span>
            <span class="value">${bookingData.show?.theatre?.name || 'N/A'}</span>
        </div>
        
        <div class="info">
            <span class="label">Date & Time:</span>
            <span class="value">${new Date(bookingData.show?.showDateTime).toLocaleString('en-IN')}</span>
        </div>
        
        <div class="info">
            <span class="label">Seats:</span>
            <span class="value">${bookingData.bookedSeats ? bookingData.bookedSeats.join(', ') : 'N/A'}</span>
        </div>
        
        <div class="info">
            <span class="label">Amount:</span>
            <span class="value">₹${bookingData.amount}</span>
        </div>
        
        <div class="info">
            <span class="label">Booking ID:</span>
            <span class="value">${bookingData._id}</span>
        </div>
        
        <div class="qr-code">
            <img src="${qrCodeDataURL}" alt="QR Code" />
            <div style="margin-top: 10px; font-size: 12px; color: #666;">
                Scan this QR code at the theatre entrance
            </div>
        </div>
        
        <div class="footer">
            <p>Please arrive 15 minutes before showtime</p>
            <p>Valid ID required • No refunds or exchanges</p>
        </div>
    </div>
</body>
</html>`;

        return {
            html: simpleHTML,
            qrCode: qrCodeDataURL,
            pdfBuffer: Buffer.from(simpleHTML), // Return HTML as buffer for compatibility
            pdfPath: null // No PDF file saved for simple version
        };
        
    } catch (error) {
        console.error('❌ Error generating simple ticket:', error);
        throw error;
    }
};