const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Role = require('./models/Role');
const fs = require('fs');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({}).populate('role');
        let out = '';
        users.forEach(u => {
            const roleSlug = u.role ? u.role.slug : 'no-role';
            const modules = (u.role && u.role.modules) ? u.role.modules.join(',') : 'no-modules';
            out += `${u.name} | ${u.email} | ${roleSlug} | ${modules}\n`;
        });
        fs.writeFileSync('users_utf8.txt', out);
    } catch (e) {
        fs.writeFileSync('error.txt', e.stack);
    } finally {
        await mongoose.disconnect();
    }
}
run();
