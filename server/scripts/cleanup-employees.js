/**
 * Script to clean up the database
 * Deletes all Employees and Users EXCEPT Super Admin
 * 
 * Run with: node server/scripts/cleanup-employees.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function cleanupDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        const User = require('../models/User');
        const Employee = require('../models/Employee');
        const Role = require('../models/Role');

        // Find Super Admin role
        const superAdminRole = await Role.findOne({ slug: 'super_admin' });
        if (!superAdminRole) {
            console.log('❌ Super Admin role not found! Aborting...');
            return;
        }
        console.log('✓ Found Super Admin role:', superAdminRole._id);

        // Find Super Admin user(s)
        const superAdminUsers = await User.find({ role: superAdminRole._id });
        const superAdminUserIds = superAdminUsers.map(u => u._id);
        const superAdminEmails = superAdminUsers.map(u => u.email);

        console.log('✓ Super Admin users to KEEP:');
        superAdminUsers.forEach(u => {
            console.log(`   - ${u.name} (${u.email})`);
        });

        // Count records before deletion
        const totalEmployees = await Employee.countDocuments({});
        const totalUsers = await User.countDocuments({});

        console.log(`\n📊 Current Database Status:`);
        console.log(`   Total Employees: ${totalEmployees}`);
        console.log(`   Total Users: ${totalUsers}`);

        // Find employees linked to Super Admin (to exclude from deletion)
        const superAdminEmployees = await Employee.find({ user: { $in: superAdminUserIds } });
        const superAdminEmployeeIds = superAdminEmployees.map(e => e._id);

        console.log(`   Super Admin Employees to KEEP: ${superAdminEmployees.length}`);

        // Delete all employees except Super Admin's
        console.log('\n🗑️  Deleting Employees (except Super Admin)...');
        const employeeDeleteResult = await Employee.deleteMany({
            _id: { $nin: superAdminEmployeeIds }
        });
        console.log(`   ✓ Deleted ${employeeDeleteResult.deletedCount} employees`);

        // Delete all users except Super Admin
        console.log('\n🗑️  Deleting Users (except Super Admin)...');
        const userDeleteResult = await User.deleteMany({
            _id: { $nin: superAdminUserIds }
        });
        console.log(`   ✓ Deleted ${userDeleteResult.deletedCount} users`);

        // Final count
        const remainingEmployees = await Employee.countDocuments({});
        const remainingUsers = await User.countDocuments({});

        console.log(`\n✅ Cleanup Complete!`);
        console.log(`📊 Final Database Status:`);
        console.log(`   Remaining Employees: ${remainingEmployees}`);
        console.log(`   Remaining Users: ${remainingUsers}`);

        console.log(`\n📌 You can now log in with the Super Admin account:`);
        superAdminUsers.forEach(u => {
            console.log(`   Email: ${u.email}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n✓ Disconnected from MongoDB');
    }
}

cleanupDatabase();
