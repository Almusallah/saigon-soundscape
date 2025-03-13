// Health check endpoint
app.get('/api/health', async (req, res) => {
  // Check if B2 credentials are configured
  const b2Configured = !!(
    process.env.B2_APPLICATION_KEY_ID && 
    process.env.B2_APPLICATION_KEY && 
    process.env.B2_BUCKET_NAME
  );
  
  // Create a storage status response
  const storage = {
    storageClass: 'Backblaze B2',
    working: b2Configured,
    availableSpace: 'Unlimited',
    error: b2Configured ? null : 'Missing B2 configuration'
  };
  
  console.log('Health endpoint called, returning storage status:', {
    working: storage.working,
    error: storage.error
  });
  
  // Return the health status
  res.json({
    status: 'OK',
    message: 'API server is running',
    timestamp: new Date().toISOString(),
    storage: storage,
    recordingsCount: 0, // This would be replaced with actual count from database
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      hasB2Config: b2Configured
    },
    cors: {
      allowedOrigins: ['https://saigon-soundscape-officinegap.vercel.app', 'http://localhost:3000']
    }
  });
});
