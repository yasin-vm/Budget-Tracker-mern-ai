import User from '../models/userModels.js';
import { hashPassword } from '../services/authService.js';

export default async function seedDefaultAdmin() {
    const adminExists = await User.exists({ role: 'admin' });
    if (!adminExists) {
        await User.create({
            name: 'Administrator',
            username: 'admin',
            email: 'admin@budgetai.com',
            phone: 9999999999,
            password: await hashPassword('Password123!'),
            dob: new Date('1995-01-01T00:00:00.000Z'),
            budgetLimit: 50000,
            role: 'admin'
        });
    }
    console.log('Default Admin -> Username: admin | Password: Password123!');
}
