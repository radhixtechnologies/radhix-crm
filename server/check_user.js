const mongoose = require('mongoose');
require('dotenv').config();
const Role = require('./models/Role');
const User = require('./models/User');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: 'srivastavaneharika41@gmail.com' }).populate('role');
        if (!user) {
            console.log('User not found');
            return;
        }
        console.log('User:', user.email);
        console.log('Role Name:', user.role ? user.role.name : 'No Role');
        console.log('Role Slug:', user.role ? user.role.slug : 'No Role');
        console.log('Role Modules:', user.role ? user.role.modules : []);
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
}

check();
