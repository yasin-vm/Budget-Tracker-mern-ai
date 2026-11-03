import User from "../models/userModels.js";

export const signup = async (req, res) => {
    try {
        const { name, dob, phone, email, username, password, budgetLimit } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'user already exist' });
        }
        if (!name || !dob) {
            return res.status(400).json({ success: false, message: 'Name and date of birth are required' });
        }

        const user = await User.create({
            name,
            dob,
            phone,
            email,
            username,
            password,
            budgetLimit: budgetLimit || 20000
        });
        res.status(201).json({ success: true, message: 'signup success', data: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.password !== password) {
            return res.status(401).json({
                success: false,
                message: "Wrong password"
            });
        }

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getProfile = async (req, res) => {
    try {
        const userId = req.params.userId || req.query.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const {
            _id,
            name,
            dob,
            email,
            username,
            phone,
            budgetLimit
        } = req.body;
        const user = await User.findByIdAndUpdate(
            _id,
            {
                name,
                dob,
                email,
                username,
                phone,
                budgetLimit
            },
            { returnDocument: 'after' }
        );

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
