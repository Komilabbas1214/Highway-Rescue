
const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI is missing in environment variables');
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(
      `[Database] MongoDB Atlas connected: ${mongoose.connection.host}`
    );

  } catch (err) {
    console.error('[Database] Connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
