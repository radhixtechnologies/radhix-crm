const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
require('dotenv').config();

/**
 * Script to check and fix user roles
 * This ensures all users have valid role references
 */

async function checkAndFixUserRoles() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm');
        console.log('✓ Connected to MongoDB\n');

        // Get all users
        const users = await User.find().populate('role');
        console.log(`📊 Found ${users.length} user(s) in database\n`);

        if (users.length === 0) {
            console.log('⚠️  No users found in database');
            console.log('   You may need to create a user first\n');
            process.exit(0);
        }

        // Get all roles
        const roles = await Role.find();
        console.log(`📋 Available roles:`);
        roles.forEach(role => {
            console.log(`   - ${role.name} (${role.slug}) - Modules: ${role.modules.join(', ')}`);
        });
        console.log('');

        // Check each user
        let fixedCount = 0;
        for (const user of users) {
            console.log(`👤 User: ${user.name} (${user.email})`);

            if (!user.role) {
                console.log(`   ❌ No role assigned!`);

                // Check if user has legacyRole
                if (user.legacyRole) {
                    console.log(`   📝 Found legacy role: ${user.legacyRole}`);

                    // Map legacy role to new role
                    let roleSlug = user.legacyRole;
                    const newRole = await Role.findOne({ slug: roleSlug });

                    if (newRole) {
                        user.role = newRole._id;
                        await user.save();
                        console.log(`   ✓ Assigned role: ${newRole.name} (${newRole.slug})`);
                        fixedCount++;
                    } else {
                        console.log(`   ❌ Could not find role with slug: ${roleSlug}`);
                    }
                } else {
                    // Assign default employee role
                    const employeeRole = await Role.findOne({ slug: 'employee' });
                    if (employeeRole) {
                        user.role = employeeRole._id;
                        await user.save();
                        console.log(`   ✓ Assigned default role: ${employeeRole.name}`);
                        fixedCount++;
                    }
                }
            } else {
                console.log(`   ✓ Role: ${user.role.name} (${user.role.slug})`);
                console.log(`   ✓ Modules: ${user.role.modules.join(', ')}`);
            }
            console.log('');
        }

        if (fixedCount > 0) {
            console.log(`\n✅ Fixed ${fixedCount} user(s)\n`);
        } else {
            console.log(`\n✅ All users have valid roles\n`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run the function
checkAndFixUserRoles();
