# 🔧 Chrome Dependencies Fix Guide

## Problem
Your server is missing required Chrome libraries, causing Puppeteer to fail with:
```
libatk-1.0.so.0: cannot open shared object file: No such file or directory
```

## Quick Fix Options

### Option 1: Install Chrome Dependencies (Recommended)

**On your Ubuntu server, run:**

```bash
# Make the script executable
chmod +x install-chrome-deps.sh

# Run the installation script
./install-chrome-deps.sh
```

**Or install manually:**

```bash
# Update package list
sudo apt-get update

# Install Chrome dependencies
sudo apt-get install -y \
  libasound2 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libgtk-3-0 libnspr4 libnss3 \
  libxcomposite1 libxdamage1 libxrandr2 \
  libgbm1 libxss1 libgconf-2-4

# Install Google Chrome
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
sudo apt-get update
sudo apt-get install -y google-chrome-stable

# Restart your Node.js application
pm2 restart popcorn  # or however you restart your app
```

### Option 2: Use Fallback System (Already Implemented)

The code now includes a fallback system:
- ✅ **First attempt**: High-quality PDF with Puppeteer
- ✅ **If Puppeteer fails**: Simple HTML ticket with QR code
- ✅ **User experience**: Never broken, always gets a ticket

### Option 3: Environment Variables

Add to your server environment:
```bash
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export CHROME_PATH=/usr/bin/google-chrome-stable
```

## Verification

After installing dependencies, test:

```bash
# Check if Chrome is installed
google-chrome-stable --version

# Test your ticket endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://popcorn-backend.duckdns.org/api/tickets/test
```

## Current Status

Your application will now:
1. ✅ **Try Puppeteer first** (best quality PDF tickets)
2. ✅ **Fall back to simple tickets** if Chrome dependencies are missing
3. ✅ **Never fail completely** - users always get tickets
4. ✅ **Show clear error messages** about what needs to be installed

## Next Steps

1. **Install Chrome dependencies** using the script above
2. **Restart your application**
3. **Test ticket download/email functionality**
4. **Monitor logs** for success messages

The ticket system will work immediately with the fallback, and will upgrade to high-quality PDFs once Chrome dependencies are installed.