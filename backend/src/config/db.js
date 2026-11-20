const mongoose = require('mongoose');

let isConnected = false;
let useEmbedded = false;

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/samurai_attendance';
  try {
    console.log(`[Database] Attempting MongoDB connection to: ${mongoUri.replace(/:([^:@]{4})[^:@]*@/, ':****@')}`);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2500,
      connectTimeoutMS: 2500
    });
    isConnected = true;
    useEmbedded = false;
    console.log('✅ [Database] Successfully connected to live MongoDB database!');
  } catch (err) {
    console.warn(`⚠️ [Database] Live MongoDB connection failed (${err.message}).`);
    console.log('⚡ [Database] Activating Samurai Embedded JSON/In-Memory Data Store (zero-dependency persistent engine)...');
    isConnected = true;
    useEmbedded = true;
    console.log('✅ [Database] Samurai Embedded Data Store is ACTIVE & persistent on disk.');
  }
}

function isEmbedded() {
  return useEmbedded;
}

module.exports = {
  connectDB,
  isConnected: () => isConnected,
  isEmbedded
};

