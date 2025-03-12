// CORS configuration

const corsOptions = {
  origin: [
    'https://saigon-soundscape-officinegap.vercel.app',
    'http://localhost:3000' // For local development
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  credentials: true, // Important for requests with credentials
  maxAge: 86400 // Cache preflight requests for 24 hours
};

module.exports = corsOptions;
