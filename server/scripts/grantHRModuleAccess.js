const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Script to grant HR module access to a user
 * Usage: node server/scripts/grantHRModuleAccess.js <email>
 * Example: node server/scripts/grantHRModuleAccess.js admin@example.com
 */

async function grantHRAccess() {
    try {
        // Get email from command line argument
        const email = process.argv[2];

        if (!email) {
            console.error('❌ Error: Please provide an email address');
            console.log('Usage: node server/scripts/grantHRModuleAccess.js <email>');
            process.exit(1);
        }

        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB\n');

        // Import User model
        const User = require('../models/User');

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.error(`❌ User not found with email: ${email}`);
            process.exit(1);
        }

        console.log(`Found user: ${user.name} (${user.email})`);
        console.log(`Current role: ${user.role}`);
        console.log(`Current modules:`, user.modulesAccess || {});

        // Update user to grant HR module access
        user.modulesAccess = user.modulesAccess || {};
        user.modulesAccess.hrm = true;

        await user.save();

        console.log('\n✅ Successfully granted HR module access!');
        console.log(`Updated modules:`, user.modulesAccess);
        console.log('\n📝 The user can now:');
        console.log('   - Access /hrm/policies');
        console.log('   - Create and manage policies');
        console.log('   - View compliance reports');
        console.log('\n💡 Please refresh the browser and try again.');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
        process.exit(0);
    }
}

grantHRAccess();
