const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function listAllUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to:', mongoose.connection.db.databaseName);

        const users = await User.find().populate('role', 'name slug').select('email name role').sort({ email: 1 });

        console.log('\nAll Users:');
        users.forEach((u, i) => {
            console.log(`${i + 1}. ${u.email} | ${u.name} | ${u.role?.slug || 'no-role'}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

listAllUsers();
