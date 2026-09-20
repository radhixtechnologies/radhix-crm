const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
require('dotenv').config();

/**
 * Script to promote a user to Super Admin
 * Usage: node scripts/promoteUserToSuperAdmin.js <email>
 */

async function promoteToSuperAdmin() {
    try {
        // Get email from command line arguments
        const email = process.argv[2];

        if (!email) {
            console.log('❌ Please provide user email');
            console.log('Usage: node scripts/promoteUserToSuperAdmin.js <email>');
            console.log('Example: node scripts/promoteUserToSuperAdmin.js admin@example.com\n');
            process.exit(1);
        }

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm');
        console.log('✓ Connected to MongoDB\n');

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() }).populate('role');

        if (!user) {
            console.log(`❌ User not found with email: ${email}\n`);
            process.exit(1);
        }

        console.log(`👤 Found user: ${user.name} (${user.email})`);
        console.log(`   Current role: ${user.role ? user.role.name : 'None'}\n`);

        // Find Super Admin role
        const superAdminRole = await Role.findOne({ slug: 'super_admin' });

        if (!superAdminRole) {
            console.log('❌ Super Admin role not found in database');
            console.log('   Please run: node scripts/seedRolesAndPermissions.js\n');
            process.exit(1);
        }

        // Update user role
        user.role = superAdminRole._id;
        await user.save();

        console.log(`✅ User promoted to Super Admin!`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${superAdminRole.name} (${superAdminRole.slug})`);
        console.log(`   Modules: ${superAdminRole.modules.join(', ')}\n`);
        console.log('🔐 Please log out and log in again to see the changes.\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run the function
promoteToSuperAdmin();
