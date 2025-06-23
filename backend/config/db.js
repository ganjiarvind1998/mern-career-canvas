import mongoose from 'mongoose';

// Directly using your connection string (for testing purposes)
const MONGO_URI = 'mongodb+srv://ganjiarvind92:1991@cluster0.areuwwa.mongodb.net/resume-app?retryWrites=true&w=majority&appName=Cluster0';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10
    });
    console.log('✅ MongoDB Atlas Connected...');
  } catch (err) {
    console.error('❌ MongoDB Atlas Connection Error:', err.message);
    process.exit(1);
  }
};

// Connection events
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('⚠️ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected');
});

export default connectDB;