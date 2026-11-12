const mongoose = require('mongoose');
const env = require('./env');

let mongodInstance = null;

const migrateFacultyAccounts = async () => {
  // Multi-role RBAC restored: keep FACULTY, SUPPORT_STAFF, FINANCE_STAFF roles intact without coercing to STUDENT.
  return;
};

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);
    
    // Try primary MONGODB_URI
    try {
      const conn = await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
      await migrateFacultyAccounts();
      return conn;
    } catch (primaryErr) {
      if (env.NODE_ENV === 'production') {
        throw primaryErr;
      }
      console.warn(`[Database] Could not connect to primary MongoDB (${env.MONGODB_URI}). Initializing in-memory Mongo instance for development/testing...`);
      
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const uri = mongodInstance.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`[Database] In-Memory MongoDB Connected at: ${uri}`);
      await migrateFacultyAccounts();
      return conn;
    }
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (err) {
    console.error(`[Database Disconnect Error] ${err.message}`);
  }
};

module.exports = { connectDB, disconnectDB, migrateFacultyAccounts };
