import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { seedDatabase } from "../utils/seed.js";

let mongod = null;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (uri && uri !== "mongodb://localhost:27017/civicpulse") {
    try {
      const sanitizedHost = uri.includes("@") ? uri.split("@")[1].split("/")[0] : "external host";
      console.log(`[MongoDB] Attempting connection to ${sanitizedHost}...`);
      
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 4000,
        connectTimeoutMS: 4000,
      });
      
      console.log("[MongoDB] Connected successfully to external MongoDB Atlas cluster.");
      await seedDatabase();
      return mongoose.connection;
    } catch (err) {
      console.log("--------------------------------------------------");
      console.log("[MongoDB Notice] External MongoDB connection could not be established.");
      if (err.message.includes("whitelist") || err.message.includes("timed out") || err.message.includes("ENOTFOUND")) {
        console.log("[MongoDB Tip] To connect MongoDB Atlas from cloud environments:");
        console.log("  1. Open MongoDB Atlas (cloud.mongodb.com)");
        console.log("  2. Go to 'Network Access' -> 'IP Access List'");
        console.log("  3. Click 'Add IP Address' -> Select 'Allow Access from Anywhere' (0.0.0.0/0)");
      }
      console.log("[MongoDB] Continuing with high-performance embedded MongoDB instance.");
      console.log("--------------------------------------------------");
    }
  }

  // Try standard local MongoDB if default URI
  if (uri === "mongodb://localhost:27017/civicpulse") {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 1500 });
      console.log("[MongoDB] Connected to local MongoDB at mongodb://localhost:27017/civicpulse.");
      await seedDatabase();
      return mongoose.connection;
    } catch (err) {
      // Local instance not running, proceed to embedded MongoMemoryServer
    }
  }

  // Embedded MongoDB instance
  try {
    if (!mongod) {
      mongod = await MongoMemoryServer.create();
    }
    const memoryUri = mongod.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[MongoDB] Embedded MongoDB running and connected at ${memoryUri}`);
    await seedDatabase();
    return mongoose.connection;
  } catch (err) {
    console.error("[MongoDB] Failed to initialize embedded MongoDB:", err);
    throw err;
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
    console.log("[MongoDB] Disconnected.");
  } catch (err) {
    console.error("[MongoDB Disconnect Error]:", err);
  }
}

export default connectDB;
