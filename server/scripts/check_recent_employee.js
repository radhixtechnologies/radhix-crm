const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Employee = require('../models/Employee');
const Role = require('../models/Role');

async function checkRecentEmployee() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Get the most recently created employee
        const employee = await Employee.findOne()
            .sort({ createdAt: -1 })
            .populate({ path: 'user', populate: 'role' });

        if (!employee) {
            console.log('No employees found');
            return;
        }

        console.log('=== Most Recently Created Employee ===\n');
        console.log(`Employee ID: ${employee.employeeId}`);
        console.log(`Name: ${employee.user?.name}`);
        console.log(`Email: ${employee.user?.email}`);
        console.log(`Department: ${employee.department}`);
        console.log(`Created At: ${employee.createdAt}`);
        console.log('');
        console.log('User Role Information:');
        console.log(`  Role Name: ${employee.user?.role?.name}`);
        console.log(`  Role Slug: ${employee.user?.role?.slug}`);
        console.log(`  Role Modules: ${employee.user?.role?.modules?.join(', ') || 'NONE'}`);
        console.log(`  Role Active: ${employee.user?.role?.isActive}`);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit(0);
    }
}

checkRecentEmployee();
