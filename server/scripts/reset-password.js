/**
 * Script to reset a user's password
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const targetEmail = 'admin@zynextro.com';
const newPassword = 'zynextro@2026';

async function resetPassword() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const User = require('../models/User');

        // Find user by email
        const user = await User.findOne({ email: targetEmail });

        if (!user) {
            console.log('User not found with email:', targetEmail);
            return;
        }

        console.log('Found user:', user.name, '(' + user.email + ')');
        console.log('Resetting password to:', newPassword);

        // Update password (the User model should hash it automatically in pre-save hook)
        user.password = newPassword;
        await user.save();

        console.log('\n✅ Password reset successfully!');
        console.log('You can now log in with:');
        console.log('  Email:', targetEmail);
        console.log('  Password:', newPassword);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

resetPassword();
