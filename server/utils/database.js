const mongoose = require('mongoose');

// Set mongoose options
mongoose.set('strictQuery', true);

// Connect to MongoDB
async function connectDB() {
  try {
    // Hardcode the connection string temporarily for debugging
const connectionString = process.env.MONGO_URI;
    
    console.log("Connecting to MongoDB...");
    
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, retryWrites: true });
    
    console.log('Connected to MongoDB (saigon-soundscape cluster)');
    return true;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    return false;
  }
}

// Disconnect from MongoDB
async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    return true;
  } catch (err) {
    console.error('MongoDB disconnect error:', err);
    return false;
  }
}

module.exports = {
  connectDB,
  disconnectDB
};
