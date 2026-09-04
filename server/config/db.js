import mongoose from 'mongoose';
import dns from 'node:dns';

dns.setServers(['1.1.1.1', '8.8.8.8']);

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }

  const dbUri = process.env.MONGODB_URI || 'mongodb+srv://atlasoakofficial_db_user:kSSb97azX2fd7XKW@cluster0.tfzfkfc.mongodb.net/textileflow?retryWrites=true&w=majority';

  try {
    const conn = await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

export default connectDB;