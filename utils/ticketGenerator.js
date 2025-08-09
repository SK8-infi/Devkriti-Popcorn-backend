import QRCode from 'qrcode';
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateSimpleTicket } from './simpleTicketGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ticket template HTML
const ticketTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Movie Ticket - {{bookingId}}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            color: #ffffff;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .ticket-container {
            background: linear-gradient(145deg, #2a2a2a, #1f1f1f);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            overflow: hidden;
            max-width: 400px;
            width: 100%;
            position: relative;
        }
        
        .ticket-header {
            background: linear-gradient(135deg, #ff6b35, #f7931e);
            padding: 20px;
            text-align: center;
            position: relative;
        }
        
        .ticket-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="30" r="1.5" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="70" r="1" fill="rgba(255,255,255,0.1)"/></svg>');
            opacity: 0.3;
        }
        
        .ticket-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
            position: relative;
            z-index: 1;
        }
        
        .ticket-subtitle {
            font-size: 14px;
            opacity: 0.9;
            position: relative;
            z-index: 1;
        }
        
        .ticket-content {
            padding: 30px;
        }
        
        .movie-info {
            margin-bottom: 25px;
        }
        
        .movie-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #ffd700;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .info-label {
            color: #cccccc;
            font-weight: 500;
        }
        
        .info-value {
            color: #ffffff;
            font-weight: 600;
        }
        
        .seat-info {
            background: rgba(255, 107, 53, 0.1);
            border: 1px solid rgba(255, 107, 53, 0.3);
            border-radius: 10px;
            padding: 15px;
            margin: 20px 0;
        }
        
        .seat-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #ff6b35;
        }
        
        .qr-section {
            text-align: center;
            margin-top: 25px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .qr-code {
            background: white;
            padding: 10px;
            border-radius: 10px;
            display: inline-block;
            margin-bottom: 10px;
        }
        
        .qr-code img {
            width: 120px;
            height: 120px;
        }
        
        .booking-id {
            font-size: 12px;
            color: #cccccc;
            font-family: 'Courier New', monospace;
        }
        
        .ticket-footer {
            background: rgba(0, 0, 0, 0.2);
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #cccccc;
        }
        
        .terms {
            font-size: 10px;
            color: #999999;
            margin-top: 10px;
            line-height: 1.4;
        }
        
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 60px;
            color: rgba(255, 255, 255, 0.03);
            font-weight: bold;
            pointer-events: none;
            z-index: 0;
        }
    </style>
</head>
<body>
    <div class="ticket-container">
        <div class="watermark">TICKET</div>
        
        <div class="ticket-header">
            <div class="ticket-title">🎬 Movie Ticket</div>
            <div class="ticket-subtitle">Valid Entry Pass</div>
        </div>
        
        <div class="ticket-content">
            <div class="movie-info">
                <div class="movie-title">{{movieTitle}}</div>
                
                <div class="info-row">
                    <span class="info-label">Theatre:</span>
                    <span class="info-value">{{theatreName}}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Date:</span>
                    <span class="info-value">{{showDate}}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Time:</span>
                    <span class="info-value">{{showTime}}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Language:</span>
                    <span class="info-value">{{language}}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Format:</span>
                    <span class="info-value">{{format}}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Room:</span>
                    <span class="info-value">{{roomName}}</span>
                </div>
            </div>
            
            <div class="seat-info">
                <div class="seat-title">🎫 Seat Details</div>
                <div class="info-row">
                    <span class="info-label">Seat Number:</span>
                    <span class="info-value">{{seatNumber}}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Price:</span>
                    <span class="info-value">₹{{price}}</span>
                </div>
            </div>
            
            <div class="qr-section">
                <div class="qr-code">
                    <img src="{{qrCodeDataUrl}}" alt="QR Code">
                </div>
                <div class="booking-id">Booking ID: {{bookingId}}</div>
            </div>
        </div>
        
        <div class="ticket-footer">
            <div>🎭 Devkriti Popcorn</div>
            <div class="terms">
                • Please arrive 15 minutes before showtime<br>
                • Valid ID required for entry<br>
                • No refunds or exchanges<br>
                • Mobile phones must be silent during the show
            </div>
        </div>
    </div>
</body>
</html>
`;

// Generate QR code for booking
const generateQRCode = async (bookingData) => {
    try {
        // Try different possible field names for date/time
        const dateTimeField = bookingData.show?.showDateTime || 
                             bookingData.show?.time || 
                             bookingData.show?.dateTime;
        
        let showDate = 'Date not available';
        let showTime = 'Time not available';
        
        if (dateTimeField) {
            const showDateTime = new Date(dateTimeField);
            if (!isNaN(showDateTime.getTime())) {
                showDate = showDateTime.toLocaleDateString('en-IN');
                showTime = showDateTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            }
        }
        
        const qrData = JSON.stringify({
            bookingId: bookingData._id,
            movieTitle: bookingData.show?.movie?.title,
            theatreName: bookingData.show?.theatre?.name,
            showDate: showDate,
            showTime: showTime,
            seats: bookingData.bookedSeats,
            amount: bookingData.amount,
            userId: bookingData.user?._id
        });
        
        const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        
        return qrCodeDataUrl;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw error;
    }
};

// Generate ticket HTML
const generateTicketHTML = async (bookingData) => {
    try {
        const qrCodeDataUrl = await generateQRCode(bookingData);
        
        // Check if showDateTime exists and format it properly
        let showDate = 'Date not available';
        let showTime = 'Time not available';
        
        // Debug: Log the exact structure to understand the fields
        console.log('🔍 DEBUG - Booking data keys:', Object.keys(bookingData));
        console.log('🔍 DEBUG - Show data keys:', Object.keys(bookingData.show || {}));
        console.log('🔍 DEBUG - Show object:', JSON.stringify(bookingData.show, null, 2));
        
        // Try different possible field names and structures
        const dateTimeField = bookingData.show?.showDateTime || 
                             bookingData.show?.time || 
                             bookingData.show?.dateTime;
        
        if (dateTimeField) {
            const showDateTime = new Date(dateTimeField);
            if (!isNaN(showDateTime.getTime())) {
                showDate = showDateTime.toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                
                showTime = showDateTime.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        }
        
        // Get room information for format
        let roomInfo = null;
        let format = 'Standard';
        let roomName = 'Unknown Room';
        
        if (bookingData.show?.theatre?.rooms && bookingData.show?.room) {
            roomInfo = bookingData.show.theatre.rooms.find(room => 
                room._id.toString() === bookingData.show.room.toString()
            );
            if (roomInfo) {
                format = roomInfo.type || 'Standard';
                roomName = roomInfo.name || 'Unknown Room';
            }
        }
        
        // Prepare template data
        const templateData = {
            bookingId: bookingData._id,
            movieTitle: bookingData.show?.movie?.title || 'Unknown Movie',
            theatreName: bookingData.show?.theatre?.name || 'Unknown Theatre',
            showDate: showDate,
            showTime: showTime,
            language: bookingData.show?.language || 'Unknown',
            format: format,
            roomName: roomName,
            seatNumber: bookingData.bookedSeats && bookingData.bookedSeats.length > 0 
                       ? bookingData.bookedSeats.join(', ') 
                       : 'N/A',
            price: bookingData.amount || 0,
            qrCodeDataUrl: qrCodeDataUrl
        };
        
        // Compile template
        const template = handlebars.compile(ticketTemplate);
        const html = template(templateData);
        
        return html;
    } catch (error) {
        console.error('Error generating ticket HTML:', error);
        throw error;
    }
};

// Generate PDF from HTML
const generateTicketPDF = async (html, bookingId) => {
    try {
        console.log('🔄 Launching Puppeteer for PDF generation...');
        
        // Try to detect if we're in a limited environment
        const isLimitedEnv = process.env.NODE_ENV === 'production' || process.platform === 'linux';
        
        const browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-default-apps',
                '--no-default-browser-check',
                '--disable-background-timer-throttling',
                '--disable-renderer-backgrounding',
                '--disable-backgrounding-occluded-windows'
            ],
            timeout: 60000, // 60 second timeout
            executablePath: isLimitedEnv ? '/usr/bin/google-chrome-stable' : undefined
        });
        
        console.log('✅ Puppeteer browser launched successfully');
        
        const page = await browser.newPage();
        console.log('📄 Setting page content...');
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        console.log('🖨️ Generating PDF...');
        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });
        
        console.log('✅ PDF generated successfully, closing browser...');
        await browser.close();
        
        // Save PDF to disk
        const pdfPath = path.join(__dirname, '../tickets', `${bookingId}.pdf`);
        await fs.ensureDir(path.dirname(pdfPath));
        await fs.writeFile(pdfPath, pdfBuffer);
        
        return {
            pdfBuffer,
            pdfPath
        };
    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        // More specific error information
        if (error.message.includes('Protocol error')) {
            console.error('🚨 Puppeteer Protocol Error - This often indicates Chrome/Chromium issues in deployment');
        }
        if (error.message.includes('Navigation timeout')) {
            console.error('🚨 Navigation Timeout - Consider increasing timeout or checking page content');
        }
        if (error.message.includes('spawn')) {
            console.error('🚨 Spawn Error - Chrome/Chromium executable may be missing or permissions issue');
        }
        
        // Check if this is a Chrome dependency issue
        if (error.message.includes('libatk') || error.message.includes('shared libraries') || error.message.includes('Failed to launch')) {
            console.error('🚨 Chrome dependencies missing - attempting simple fallback');
            throw new Error('Chrome dependencies missing for PDF generation. Please install required system packages or use alternative PDF generation.');
        }
        
        throw new Error(`PDF Generation Failed: ${error.message}`);
    }
};

// Generate complete ticket with fallback
export const generateTicket = async (bookingData) => {
    try {
        console.log('🎫 Generating ticket for booking:', bookingData._id);
        
        // Try Puppeteer first (best quality)
        try {
            const html = await generateTicketHTML(bookingData);
            const { pdfBuffer, pdfPath } = await generateTicketPDF(html, bookingData._id);
            
            console.log('✅ Ticket generated successfully with Puppeteer:', pdfPath);
            return { 
                html, 
                pdfBuffer, 
                pdfPath, 
                bookingId: bookingData._id 
            };
            
        } catch (puppeteerError) {
            console.error('⚠️ Puppeteer failed, falling back to simple ticket:', puppeteerError.message);
            
            // Fall back to simple ticket generation
            const simpleTicket = await generateSimpleTicket(bookingData);
            console.log('✅ Simple ticket generated successfully');
            
            return {
                html: simpleTicket.html,
                pdfBuffer: Buffer.from(simpleTicket.html), // HTML as buffer
                pdfPath: null, // No PDF file for simple version
                bookingId: bookingData._id,
                isSimple: true
            };
        }
        
    } catch (error) {
        console.error('❌ Error generating ticket (all methods failed):', error);
        throw error;
    }
};

// Clean up old ticket files
export const cleanupOldTickets = async () => {
    try {
        const ticketsDir = path.join(__dirname, '../tickets');
        const exists = await fs.pathExists(ticketsDir);
        
        if (!exists) return;
        
        const files = await fs.readdir(ticketsDir);
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        for (const file of files) {
            const filePath = path.join(ticketsDir, file);
            const stats = await fs.stat(filePath);
            
            // Delete files older than 24 hours
            if (now - stats.mtime.getTime() > oneDay) {
                await fs.remove(filePath);
                console.log('🗑️ Cleaned up old ticket file:', file);
            }
        }
    } catch (error) {
        console.error('Error cleaning up old tickets:', error);
    }
}; 