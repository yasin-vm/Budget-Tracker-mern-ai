import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
        await mongoose.connect(mongoUri);
        console.log(`Connected to MongoDB: ${mongoUri}`);
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
    }
};

export default connectDB;
