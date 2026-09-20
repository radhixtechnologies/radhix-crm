// Diagnostic script to check lead assignments
// Run this in your MongoDB shell or using Node.js

const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI);

const Lead = require('./server/models/Lead');
const Employee = require('./server/models/Employee');
const User = require('./server/models/User');

async function diagnoseLeadAssignments() {
    console.log('\n🔍 LEAD ASSIGNMENT DIAGNOSTIC\n');

    // 1. Get all leads
    const allLeads = await Lead.find({}).select('name email assignedTo');
    console.log(`📊 Total Leads in Database: ${allLeads.length}\n`);

    // 2. Show each lead and its assignment
    console.log('📋 Lead Assignments:');
    for (const lead of allLeads) {
        const assigned = lead.assignedTo ? `Assigned to: ${lead.assignedTo}` : 'UNASSIGNED';
        console.log(`  - ${lead.name} (${lead.email}): ${assigned}`);
    }

    // 3. Get all employees
    console.log('\n👥 Employees:');
    const employees = await Employee.find({}).populate('user', 'name email');
    for (const emp of employees) {
        console.log(`  - Employee ID: ${emp._id}`);
        console.log(`    User: ${emp.user?.name} (${emp.user?.email})`);
        console.log(`    User ID: ${emp.user?._id}`);

        // Count leads assigned to this employee
        const assignedCount = await Lead.countDocuments({ assignedTo: emp._id });
        console.log(`    Leads Assigned: ${assignedCount}\n`);
    }

    // 4. Check for mismatches
    console.log('\n⚠️  Checking for Issues:');
    const leadsWithInvalidAssignment = await Lead.find({
        assignedTo: { $ne: null }
    }).select('name assignedTo');

    for (const lead of leadsWithInvalidAssignment) {
        const employeeExists = await Employee.findById(lead.assignedTo);
        if (!employeeExists) {
            console.log(`  ❌ Lead "${lead.name}" assigned to non-existent employee: ${lead.assignedTo}`);
        }
    }

    mongoose.connection.close();
}

diagnoseLeadAssignments().catch(console.error);
