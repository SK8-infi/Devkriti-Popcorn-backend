import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const setupAdEmails = () => {
    try {
        const envPath = path.join(__dirname, '.env');
        
        // Check if .env file exists
        if (!fs.existsSync(envPath)) {
            console.log('❌ .env file not found!');
            console.log('Please create a .env file in the backend directory first.');
            return;
        }

        // Read current .env content
        const envContent = fs.readFileSync(envPath, 'utf8');
        
        // Check if AD_EMAILS already exists
        if (envContent.includes('AD_EMAILS=')) {
            console.log('✅ AD_EMAILS is already configured in your .env file');
            console.log('Current AD_EMAILS:', envContent.match(/AD_EMAILS=([^\n]+)/)?.[1] || 'Not set');
            return;
        }

        // Add AD_EMAILS to .env
        const adEmails = 'shivansh.katiyar1712@gmail.com,veditha888@gmail.com,prabalpoddar73@gmail.com';
        const newEnvContent = envContent + `\nAD_EMAILS=${adEmails}`;
        
        fs.writeFileSync(envPath, newEnvContent);
        
        console.log('✅ AD_EMAILS added to .env file successfully!');
        console.log('AD_EMAILS:', adEmails);
        console.log('\n📝 The following emails now have access to Manage Users:');
        adEmails.split(',').forEach(email => {
            console.log(`   • ${email.trim()}`);
        });
        
    } catch (error) {
        console.error('❌ Error setting up AD_EMAILS:', error);
    }
};

setupAdEmails(); 