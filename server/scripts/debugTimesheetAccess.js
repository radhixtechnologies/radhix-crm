const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Employee = require('../models/Employee');
const Timesheet = require('../models/Timesheet');
const Role = require('../models/Role');

async function debugTimesheetAccess() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to:', mongoose.connection.db.databaseName);
        console.log('\n' + '='.repeat(80));

        // Test with Charu Sarswat's email
        const testEmail = 'charusarswat639649@gmail.com';

        console.log(`\n🔍 DEBUGGING TIMESHEET ACCESS FOR: ${testEmail}`);
        console.log('='.repeat(80));

        // 1. Find the user
        const user = await User.findOne({ email: testEmail }).populate('role', 'name slug level');

        if (!user) {
            console.log(`\n❌ User not found with email: ${testEmail}`);
            console.log('\n📋 Available users:');
            const allUsers = await User.find().select('email name').limit(10);
            allUsers.forEach(u => console.log(`   - ${u.email} (${u.name})`));
            return;
        }

        console.log(`\n✅ User Found:`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role?.name || 'N/A'} (${user.role?.slug || 'N/A'})`);
        console.log(`   Department: ${user.department || 'N/A'}`);
        console.log(`   User ID: ${user._id}`);

        // 2. Find employee record
        const employee = await Employee.findOne({ user: user._id });

        if (!employee) {
            console.log(`\n❌ No employee record found for this user`);
        } else {
            console.log(`\n✅ Employee Record:`);
            console.log(`   Employee ID: ${employee.employeeId}`);
            console.log(`   Department: ${employee.department}`);
            console.log(`   Designation: ${employee.designation}`);
            console.log(`   Employee _id: ${employee._id}`);
        }

        // 3. Get all timesheets in database
        const allTimesheets = await Timesheet.find()
            .populate('employee', 'employeeId user')
            .populate('createdBy', 'name email');

        console.log(`\n\n📊 ALL TIMESHEETS IN DATABASE (${allTimesheets.length} total)`);
        console.log('='.repeat(80));

        allTimesheets.forEach((ts, index) => {
            const isOwnTimesheet = ts.createdBy?._id?.toString() === user._id.toString();
            console.log(`\n${index + 1}. Timesheet ID: ${ts._id}`);
            console.log(`   Date: ${ts.date.toISOString().split('T')[0]}`);
            console.log(`   Employee: ${ts.employee?.employeeId || 'N/A'}`);
            console.log(`   Created By: ${ts.createdBy?.name || 'N/A'} (${ts.createdBy?.email || 'N/A'})`);
            console.log(`   Created By ID: ${ts.createdBy?._id}`);
            console.log(`   Role of Creator: ${ts.roleOfCreator}`);
            console.log(`   Work: ${ts.workDescription}`);
            console.log(`   Hours: ${ts.hours}`);
            console.log(`   ${isOwnTimesheet ? '✅ THIS IS YOUR TIMESHEET' : '❌ NOT YOUR TIMESHEET'}`);
        });

        // 4. Simulate the backend query with view=my
        console.log(`\n\n🔍 SIMULATING BACKEND QUERY WITH view=my`);
        console.log('='.repeat(80));

        const query = { createdBy: user._id };
        console.log(`\nQuery: ${JSON.stringify(query)}`);

        const myTimesheets = await Timesheet.find(query)
            .populate('employee', 'employeeId user')
            .populate('createdBy', 'name email');

        console.log(`\n✅ TIMESHEETS THAT SHOULD BE SHOWN (${myTimesheets.length} total):`);
        myTimesheets.forEach((ts, index) => {
            console.log(`\n${index + 1}. ${ts.employee?.employeeId || 'N/A'} - ${ts.date.toISOString().split('T')[0]}`);
            console.log(`   Work: ${ts.workDescription}`);
            console.log(`   Hours: ${ts.hours}`);
        });

        // 5. Check role-based access
        console.log(`\n\n🔐 ROLE-BASED ACCESS ANALYSIS`);
        console.log('='.repeat(80));

        const roleSlug = user.role?.slug;
        console.log(`\nYour Role: ${roleSlug}`);

        if (roleSlug === 'super_admin' || roleSlug === 'hrm_admin') {
            console.log(`\n✅ As ${roleSlug}:`);
            console.log(`   - In HRM Module (/hrm/timesheets): You see ALL ${allTimesheets.length} timesheets`);
            console.log(`   - In My Workspace (/employees/timesheets): You see ONLY ${myTimesheets.length} timesheet(s)`);
        } else if (roleSlug === 'admin' || roleSlug?.endsWith('_admin')) {
            const dept = employee?.department || user.department;
            const deptEmployees = await Employee.find({ department: dept }).select('_id');
            const deptEmpIds = deptEmployees.map(e => e._id.toString());

            const deptTimesheets = allTimesheets.filter(ts => {
                const empId = ts.employee?._id?.toString();
                const creatorId = ts.createdBy?._id?.toString();
                return deptEmpIds.includes(empId) || creatorId === user._id.toString();
            });

            console.log(`\n✅ As ${roleSlug} (Department: ${dept}):`);
            console.log(`   - In HRM Module (/hrm/timesheets): You see ${deptTimesheets.length} timesheet(s) (your dept + own)`);
            console.log(`   - In My Workspace (/employees/timesheets): You see ONLY ${myTimesheets.length} timesheet(s)`);
        } else {
            console.log(`\n✅ As ${roleSlug}:`);
            console.log(`   - In HRM Module (/hrm/timesheets): You see ONLY ${myTimesheets.length} timesheet(s)`);
            console.log(`   - In My Workspace (/employees/timesheets): You see ONLY ${myTimesheets.length} timesheet(s)`);
        }

        // 6. Check for potential issues
        console.log(`\n\n⚠️  POTENTIAL ISSUES CHECK`);
        console.log('='.repeat(80));

        let issuesFound = false;

        // Check if createdBy is properly set
        const timesheetsWithoutCreator = allTimesheets.filter(ts => !ts.createdBy);
        if (timesheetsWithoutCreator.length > 0) {
            console.log(`\n❌ ISSUE: ${timesheetsWithoutCreator.length} timesheet(s) have no createdBy field!`);
            issuesFound = true;
        }

        // Check if employee field is properly set
        const timesheetsWithoutEmployee = allTimesheets.filter(ts => !ts.employee);
        if (timesheetsWithoutEmployee.length > 0) {
            console.log(`\n❌ ISSUE: ${timesheetsWithoutEmployee.length} timesheet(s) have no employee field!`);
            issuesFound = true;
        }

        if (!issuesFound) {
            console.log(`\n✅ No data integrity issues found in timesheets`);
        }

        console.log(`\n\n${'='.repeat(80)}`);
        console.log(`✅ DEBUG COMPLETE`);
        console.log(`${'='.repeat(80)}\n`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await mongoose.connection.close();
    }
}

debugTimesheetAccess();
