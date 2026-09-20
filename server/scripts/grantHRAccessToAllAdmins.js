const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

/**
 * Script to grant HR module access to ALL admin and super_admin users
 * Usage: node server/scripts/grantHRAccessToAllAdmins.js
 */

async function grantHRAccessToAllAdmins() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB\n');

        const User = require('../models/User');

        // Find all admin and super_admin users
        const adminUsers = await User.find({
            role: { $in: ['admin', 'super_admin'] }
        });

        if (adminUsers.length === 0) {
            console.log('No admin users found');
            process.exit(0);
        }

        console.log(`Found ${adminUsers.length} admin user(s)\n`);

        let updatedCount = 0;

        for (const user of adminUsers) {
            console.log(`Processing: ${user.name} (${user.email}) - ${user.role}`);

            user.modulesAccess = user.modulesAccess || {};

            if (!user.modulesAccess.hrm) {
                user.modulesAccess.hrm = true;
                await user.save();
                console.log('  ✅ Granted HR module access');
                updatedCount++;
            } else {
                console.log('  ℹ️  Already has HR module access');
            }
        }

        console.log(`\n✅ Updated ${updatedCount} user(s)`);
        console.log('\n💡 All admin users can now access the Policies module!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
        process.exit(0);
    }
}

grantHRAccessToAllAdmins();
