const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zynextro-crm';

    console.log('Attempting to connect to MongoDB...');
    console.log(`MongoDB URI: ${mongoURI.replace(/\/\/.*@/, '//***@')}`); // Hide credentials in logs

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      family: 4, // Use IPv4, skip IPv6
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain at least 2 socket connections
    });

    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    console.log(`✓ Database: ${conn.connection.name}`);

    // Sync indexes to fix any duplicate index issues
    try {
      // Require the model here to ensure it uses the established connection
      const LeaveBalance = require('../models/LeaveBalance');
      await LeaveBalance.syncIndexes();
      console.log('✓ LeaveBalance indexes synced successfully');
    } catch (idxErr) {
      console.warn('⚠ Warning: Failed to sync LeaveBalance indexes:', idxErr.message);
    }

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('✗ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✓ MongoDB reconnected');
    });

  } catch (error) {
    console.error('✗ MongoDB connection failed:');
    console.error(`   Error: ${error.message}`);

    if (error.name === 'MongoServerSelectionError') {
      console.error('   Possible causes:');
      console.error('   - MongoDB server is not running');
      console.error('   - Incorrect MongoDB URI in .env file');
      console.error('   - Network connectivity issues');
      console.error('   - Firewall blocking connection');
    }

    // Throw error instead of exiting - let server.js handle it
    throw error;
  }
};

module.exports = connectDB;

