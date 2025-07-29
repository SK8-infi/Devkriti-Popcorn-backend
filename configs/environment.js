// Environment configuration helper
export const getEnvironmentConfig = () => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return {
        // Backend URLs
        backendUrl: process.env.BACKEND_URL || (isDevelopment ? 'http://localhost:5000' : 'https://your-backend-url.vercel.app'),
        
        // Frontend URLs
        frontendUrl: process.env.FRONTEND_URL || (isDevelopment ? 'http://localhost:5173' : 'https://your-frontend-url.vercel.app'),
        
        // Database
        mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/popcorn',
        
        // JWT
        jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        
        // OAuth
        googleClientId: process.env.GOOGLE_CLIENT_ID,
        googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
        githubClientId: process.env.GITHUB_CLIENT_ID,
        githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
        
        // Email
        emailUser: process.env.EMAIL_USER,
        emailAppPassword: process.env.EMAIL_APP_PASSWORD,
        
        // Stripe
        stripeSecretKey: process.env.STRIPE_SECRET_KEY,
        stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        
        // TMDB
        tmdbApiKey: process.env.TMDB_API_KEY,
        
        // Environment
        isDevelopment,
        isProduction: !isDevelopment
    };
}; 