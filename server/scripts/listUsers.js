const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to:', mongoose.connection.db.databaseName);
        console.log('\n' + '='.repeat(60));

        const users = await User.find({ isActive: true })
            .populate('role', 'name slug level')
            .select('name email role department')
            .sort({ email: 1 });

        console.log(`\n📧 ACTIVE USERS (${users.length} total)\n`);
        console.log('='.repeat(60));

        users.forEach((user, index) => {
            console.log(`\n${index + 1}. ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role?.name || 'N/A'} (${user.role?.slug || 'N/A'})`);
            console.log(`   Department: ${user.department || 'N/A'}`);
        });

        console.log('\n' + '='.repeat(60));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

listUsers();
