const dns = require('dns');
const mongoose = require('mongoose');

// Configure reliable public DNS servers for resolving MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  console.warn('[DNS Warning] Could not set custom DNS servers:', dnsErr.message);
}

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inventory_db';
    
    // Configure mongoose connection options
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging indefinitely
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Connection Error] ${error.message}`);
    console.warn(`
[Tip] If you are testing locally without a local MongoDB service:
      1. Create a free MongoDB Atlas cluster at https://cloud.mongodb.com
      2. Set MONGO_URI in your .env file:
         MONGO_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/inventory_db?retryWrites=true&w=majority"
      3. Restart the server.
    `);
    // Do not crash the entire node process immediately so static UI and health check can still inform the user
    return null;
  }
};

// Check if database is currently connected
const isDbConnected = () => {
  return mongoose.connection.readyState === 1; // 1 = connected, 2 = connecting, 0 = disconnected
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Connection lost. Attempting reconnection...');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB] Connection re-established.');
});

module.exports = { connectDB, isDbConnected };
