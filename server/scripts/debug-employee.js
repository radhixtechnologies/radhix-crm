/**
 * Debug script to check employee data in database
 * Run with: node server/scripts/debug-employee.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const targetId = '6904a10b3a5301d8a87fc7dc';
const outputFile = path.join(__dirname, 'debug-output.txt');

let output = '';
const log = (msg) => {
    console.log(msg);
    output += msg + '\n';
};

async function debugEmployee() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        log('Connected to MongoDB\n');

        // Check if it's a valid ObjectId
        const isValidObjectId = mongoose.Types.ObjectId.isValid(targetId);
        log(`Is "${targetId}" a valid ObjectId: ${isValidObjectId}`);

        // Import models
        const Employee = require('../models/Employee');
        const User = require('../models/User');

        // Check if it's an Employee ID
        log('\n--- Checking Employee Collection ---');
        const employeeById = await Employee.findById(targetId);
        log(`Employee by _id: ${employeeById ? `FOUND: ${employeeById.employeeId}` : 'NOT FOUND'}`);

        // Check if it's a User ID with an associated Employee
        log('\n--- Checking User Collection ---');
        const user = await User.findById(targetId);
        log(`User by _id: ${user ? `FOUND: ${user.name} (${user.email})` : 'NOT FOUND'}`);

        if (user) {
            // Find employee for this user
            const employeeByUser = await Employee.findOne({ user: targetId });
            log(`Employee for this User: ${employeeByUser ? `FOUND: ${employeeByUser.employeeId}` : 'NOT FOUND'}`);
        }

        // List all employees and their users
        log('\n--- All Employees (First 10) ---');
        const employees = await Employee.find({ deletedAt: null })
            .limit(10)
            .populate('user', 'name email')
            .select('employeeId user');

        employees.forEach((emp, i) => {
            log(`${i + 1}. Employee _id: ${emp._id}`);
            log(`   employeeId: ${emp.employeeId}`);
            log(`   User: ${emp.user?.name || 'No User'}`);
            log(`   User _id: ${emp.user?._id || 'N/A'}`);
            log('');
        });

        // List all users
        log('\n--- All Users (First 10) ---');
        const users = await User.find({ isActive: true })
            .limit(10)
            .select('name email _id');

        users.forEach((u, i) => {
            log(`${i + 1}. User _id: ${u._id}, Name: ${u.name}, Email: ${u.email}`);
        });

        // Write output to file
        fs.writeFileSync(outputFile, output);
        console.log(`\nOutput written to: ${outputFile}`);

    } catch (error) {
        log('Error: ' + error.message);
        fs.writeFileSync(outputFile, output);
    } finally {
        await mongoose.disconnect();
        log('\nDisconnected from MongoDB');
    }
}

debugEmployee();
