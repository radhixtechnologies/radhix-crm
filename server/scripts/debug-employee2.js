/**
 * Debug script to check specific employee
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const targetId = '6904a10b3a5301d8a87fc7dc';
const outputFile = path.join(__dirname, 'debug-output2.txt');

let output = '';
const log = (msg) => {
    console.log(msg);
    output += msg + '\n';
};

async function debugEmployee() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        log('Connected to MongoDB\n');

        // Require User model first (needed for populate)
        require('../models/User');
        const Employee = require('../models/Employee');

        // Find the employee by ID without any filters (including deleted ones)
        log(`Looking for employee with _id: ${targetId}`);
        const employee = await Employee.findById(targetId);

        if (employee) {
            log('\nEmployee Found:');
            log(JSON.stringify(employee.toObject(), null, 2));
        } else {
            log('\nEmployee NOT FOUND with _id: ' + targetId);

            // Try to find by matching the first part of ID
            log('\n--- Checking all employees ---');
            const allEmployees = await Employee.find({}).select('_id employeeId deletedAt user').lean();

            log(`Total employees in DB: ${allEmployees.length}`);
            allEmployees.forEach((emp, i) => {
                log(`${i + 1}. _id: ${emp._id}, employeeId: ${emp.employeeId}, deletedAt: ${emp.deletedAt || 'null'}, user: ${emp.user}`);
            });
        }

        fs.writeFileSync(outputFile, output);
        console.log(`\nOutput written to: ${outputFile}`);

    } catch (error) {
        log('Error: ' + error.message);
        log(error.stack);
        fs.writeFileSync(outputFile, output);
    } finally {
        await mongoose.disconnect();
    }
}

debugEmployee();
