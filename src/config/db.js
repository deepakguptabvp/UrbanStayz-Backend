import mongoose from "mongoose";

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/urbanstayz";

    mongoose.connection.on("error", (err) => {
      console.warn(`⚠️ Mongoose stream error: ${err.message}`);
    });

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);
  } catch (error) {
    console.warn(`⚠️ MongoDB connection error: ${error.message}. Running in offline/fallback mode.`);
  }
};

export default connectDB;
