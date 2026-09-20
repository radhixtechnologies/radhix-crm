const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');
require('dotenv').config();

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({}).populate('role');
        console.log('--- USER ROLES CHECK ---');
        users.forEach(u => {
            console.log(`Name: ${u.name}`);
            console.log(`Email: ${u.email}`);
            console.log(`Role Slug: ${u.role?.slug || 'NONE'}`);
            console.log(`Modules: ${u.role?.modules?.join(', ') || 'N/A'}`);
            console.log('---');
        });
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

listUsers();
