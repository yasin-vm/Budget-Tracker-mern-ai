import mongoose from 'mongoose';

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully.');
};

export default connectDB;
