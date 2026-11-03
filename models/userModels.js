import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    dob: { type: Date },
    phone: { type: Number, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    budgetLimit: {
        type: Number,
        default: 20000,
        min: 0
    },
    salary: { type: Number, default: 0, min: 0 }
});

const User = mongoose.model('users', userSchema);

export default User;
