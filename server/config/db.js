import mongoose from 'mongoose';
import dns from "dns";

const connectDB = async () => {
  try {
    dns.setServers(['1.1.1.1']);
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB Error: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
