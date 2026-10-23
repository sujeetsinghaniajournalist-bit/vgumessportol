const mongoose = require('mongoose');

const DEFAULT_MONGO_URI = 'mongodb+srv://sujeetsinghaniajournalist_db_user:EUrqew0NMMh19aXM@cluster0.krb1cbm.mongodb.net/vgu_mess_db?retryWrites=true&w=majority';

let isConnected = false;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }
  if (isConnected) {
    return mongoose.connection;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || DEFAULT_MONGO_URI;
    
    console.log(`Connecting to MongoDB Atlas: ${mongoUri.split('@').pop()}`);
    
    const conn = await mongoose.connect(mongoUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 8000,
    });

    isConnected = true;
    console.log(`[SUCCESS] MongoDB Connected: ${conn.connection.host} (Database: ${conn.connection.name})`);
    return conn;
  } catch (error) {
    console.error(`[ERROR] MongoDB Connection Failed: ${error.message}`);
    // Never crash the serverless container process
    return null;
  }
};

module.exports = connectDB;
