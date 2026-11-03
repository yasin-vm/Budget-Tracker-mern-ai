import User from '../models/userModels.js';
import Session from '../models/SessionModel.js';
import { hashPassword, issueSession, publicUser, verifyPassword } from '../services/authService.js';

function respondWithSession(res, user, status = 200, message = 'Login successful') {
    return issueSession(user._id).then(({ token, expiresAt }) => res.status(status).json({
        success: true,
        message,
        data: publicUser(user),
        token,
        expiresAt
    }));
}

export const signup = async (req, res) => {
    try {
        const { name, username, email, phone, password, budgetLimit } = req.body;
        const normalizedUsername = typeof username === 'string' ? username.trim().toLowerCase() : '';
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const phoneText = String(phone ?? '');
        const parsedBudget = budgetLimit === undefined || budgetLimit === '' ? 20000 : Number(budgetLimit);

        if (typeof name !== 'string' || !name.trim()
            || !/^[a-z0-9_]{3,30}$/.test(normalizedUsername)
            || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
            || !/^\d{10}$/.test(phoneText)
            || typeof password !== 'string' || password.length < 8
            || !Number.isFinite(parsedBudget) || parsedBudget < 0) {
            return res.status(400).json({
                success: false,
                message: 'Enter a name, username (3-30 letters/numbers/underscores), valid email, 10-digit phone, password (8+ characters), and non-negative budget.'
            });
        }

        const user = await User.create({
            name: name.trim(),
            username: normalizedUsername,
            email: normalizedEmail,
            phone: Number(phoneText),
            password: await hashPassword(password),
            budgetLimit: parsedBudget,
            role: 'user'
        });

        return await respondWithSession(res, user, 201, 'Account created successfully');
    } catch (error) {
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern || {})[0];
            return res.status(409).json({
                success: false,
                message: `An account with that ${duplicateField || 'username, email, or phone'} already exists.`
            });
        }
        console.error('Signup failed:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to create account.' });
    }
};

export const login = async (req, res) => {
    try {
        const username = typeof req.body.username === 'string' ? req.body.username.trim().toLowerCase() : '';
        const password = req.body.password;
        if (!username || typeof password !== 'string' || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required.' });
        }

        const user = await User.findOne({ username }).select('+password');
        if (!user || !(await verifyPassword(password, user.password))) {
            return res.status(401).json({ success: false, message: 'Invalid username or password.' });
        }

        if (!user.password.startsWith('scrypt$')) {
            user.password = await hashPassword(password);
            await user.save();
        }
        return await respondWithSession(res, user);
    } catch (error) {
        console.error('Login failed:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to log in.' });
    }
};

export const getProfile = (req, res) => res.status(200).json({
    success: true,
    data: publicUser(req.user)
});

export const logout = async (req, res) => {
    try {
        await Session.deleteOne({ _id: req.sessionId });
        return res.status(200).json({ success: true, message: 'Logged out successfully.' });
    } catch (error) {
        console.error('Logout failed:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to log out.' });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { name, email, phone, budgetLimit, salary } = req.body;
        const updates = {};
        if (name !== undefined) {
            if (typeof name !== 'string' || !name.trim()) {
                return res.status(400).json({ success: false, message: 'Name is required.' });
            }
            updates.name = name.trim();
        }
        if (email !== undefined) {
            const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
                return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
            }
            updates.email = normalizedEmail;
        }
        if (phone !== undefined) {
            const phoneText = String(phone);
            if (!/^\d{10}$/.test(phoneText)) {
                return res.status(400).json({ success: false, message: 'Enter a valid 10-digit phone number.' });
            }
            updates.phone = Number(phoneText);
        }
        for (const [field, value] of [['budgetLimit', budgetLimit], ['salary', salary]]) {
            if (value !== undefined) {
                if (value === null || (typeof value !== 'number' && typeof value !== 'string')
                    || (typeof value === 'string' && !value.trim())) {
                    return res.status(400).json({ success: false, message: `${field} must be a non-negative number.` });
                }
                const amount = Number(value);
                if (!Number.isFinite(amount) || amount < 0) {
                    return res.status(400).json({ success: false, message: `${field} must be a non-negative number.` });
                }
                updates[field] = amount;
            }
        }

        const user = await User.findByIdAndUpdate(req.user._id, updates, {
            returnDocument: 'after',
            runValidators: true
        });
        return res.status(200).json({ success: true, data: publicUser(user) });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'That email or phone is already in use.' });
        }
        return res.status(400).json({ success: false, message: error.message });
    }
};
