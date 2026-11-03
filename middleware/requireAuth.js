import Session from '../models/SessionModel.js';
import User from '../models/userModels.js';
import { hashSessionToken } from '../services/authService.js';

export default async function requireAuth(req, res, next) {
    const [scheme, token] = (req.get('authorization') || '').split(' ');
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    try {
        const session = await Session.findOne({
            tokenHash: hashSessionToken(token),
            expiresAt: { $gt: new Date() }
        });
        if (!session) {
            return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
        }

        const user = await User.findById(session.userId);
        if (!user) {
            await Session.deleteOne({ _id: session._id });
            return res.status(401).json({ success: false, message: 'Account no longer exists.' });
        }

        req.user = user;
        req.sessionId = session._id;
        next();
    } catch (error) {
        next(error);
    }
}
