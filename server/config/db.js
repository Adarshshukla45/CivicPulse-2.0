import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('[MongoDB] Connection failed:', err.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('[MongoDB] Running in development mode without database connection');
    }
  }
};

export default connectDB;
