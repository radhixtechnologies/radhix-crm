const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Employee = require('../models/Employee');

async function checkUserRole() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to:', mongoose.connection.db.databaseName);
        console.log('\n' + '='.repeat(60));

        // Check the user "Charu Sarswat" (charusarswat639649@gmail.com)
        const email = 'charusarswat639649@gmail.com';

        const user = await User.findOne({ email })
            .populate('role', 'name slug level modules');

        if (!user) {
            console.log(`❌ User not found: ${email}`);
            return;
        }

        console.log('\n👤 USER DETAILS');
        console.log('='.repeat(60));
        console.log(`Name: ${user.name}`);
        console.log(`Email: ${user.email}`);
        console.log(`Department: ${user.department || 'N/A'}`);
        console.log(`Active: ${user.isActive}`);

        console.log('\n🎭 ROLE DETAILS');
        console.log('='.repeat(60));
        if (user.role) {
            console.log(`Role Name: ${user.role.name}`);
            console.log(`Role Slug: ${user.role.slug}`);
            console.log(`Role Level: ${user.role.level}`);
            console.log(`Modules: ${user.role.modules?.join(', ') || 'N/A'}`);
        } else {
            console.log('❌ No role assigned!');
        }

        // Check employee record
        const employee = await Employee.findOne({ user: user._id });

        console.log('\n👔 EMPLOYEE DETAILS');
        console.log('='.repeat(60));
        if (employee) {
            console.log(`Employee ID: ${employee.employeeId}`);
            console.log(`Department: ${employee.department}`);
            console.log(`Designation: ${employee.designation}`);
            console.log(`Status: ${employee.status}`);
        } else {
            console.log('❌ No employee record found!');
        }

        // Determine timesheet access
        console.log('\n🔐 TIMESHEET ACCESS');
        console.log('='.repeat(60));
        const roleSlug = user.role?.slug;

        if (roleSlug === 'super_admin' || roleSlug === 'hrm_admin') {
            console.log('✅ Can view: ALL TIMESHEETS (across all departments)');
            console.log('✅ Can filter by: department, employee, date range');
            console.log('✅ Can use ?view=my to see only own timesheets');
        } else if (roleSlug === 'admin' || roleSlug?.endsWith('_admin')) {
            console.log('✅ Can view: OWN + DEPARTMENT TIMESHEETS');
            console.log(`✅ Department: ${employee?.department || user.department || 'N/A'}`);
            console.log('✅ Can use ?view=my to see only own timesheets');
        } else {
            console.log('✅ Can view: ONLY OWN TIMESHEETS');
            console.log('❌ Cannot view other employees\' timesheets');
        }

        console.log('\n' + '='.repeat(60));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

checkUserRole();
