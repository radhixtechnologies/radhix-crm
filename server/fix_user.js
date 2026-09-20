const mongoose = require('mongoose');
require('dotenv').config();
const Role = require('./models/Role');
const User = require('./models/User');

async function fix() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const targetRole = await Role.findOne({ slug: 'hrm_admin' });
        if (!targetRole) {
            console.log('Target role hrm_admin not found');
            return;
        }
        const result = await User.updateOne(
            { email: 'srivastavaneharika41@gmail.com' },
            { $set: { role: targetRole._id } }
        );
        console.log('Update Result:', result);

        // Also verify
        const updatedUser = await User.findOne({ email: 'srivastavaneharika41@gmail.com' }).populate('role');
        console.log('Updated Role Slug:', updatedUser.role.slug);
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
}

fix();
