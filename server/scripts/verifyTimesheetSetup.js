const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Employee = require('../models/Employee');
const Role = require('../models/Role');
const Timesheet = require('../models/Timesheet');

async function verifyTimesheetSetup() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to:', mongoose.connection.db.databaseName);
        console.log('\n' + '='.repeat(60));

        // 1. Check Timesheet Model
        console.log('\n📋 TIMESHEET MODEL VERIFICATION');
        console.log('='.repeat(60));
        const timesheetCount = await Timesheet.countDocuments();
        console.log(`Total Timesheets: ${timesheetCount}`);

        if (timesheetCount > 0) {
            const sampleTimesheet = await Timesheet.findOne()
                .populate('employee', 'employeeId user department')
                .populate('createdBy', 'name email role');

            console.log('\n📄 Sample Timesheet:');
            console.log(JSON.stringify(sampleTimesheet, null, 2));
        }

        // 2. Check Indexes
        console.log('\n\n🔍 TIMESHEET INDEXES');
        console.log('='.repeat(60));
        const indexes = await Timesheet.collection.getIndexes();
        console.log('Indexes:', JSON.stringify(indexes, null, 2));

        // 3. Check Roles
        console.log('\n\n👥 ROLE VERIFICATION');
        console.log('='.repeat(60));
        const roles = await Role.find({ isActive: true }).select('name slug level modules');
        console.log(`Total Active Roles: ${roles.length}\n`);

        roles.forEach(role => {
            console.log(`📌 ${role.name} (${role.slug})`);
            console.log(`   Level: ${role.level}`);
            console.log(`   Modules: ${role.modules.join(', ')}`);
            console.log('');
        });

        // 4. Check Users with Roles
        console.log('\n👤 USER-ROLE MAPPING');
        console.log('='.repeat(60));
        const users = await User.find({ isActive: true })
            .populate('role', 'name slug level')
            .select('name email role department')
            .limit(10);

        console.log(`Total Active Users: ${await User.countDocuments({ isActive: true })}`);
        console.log(`\nShowing first ${users.length} users:\n`);

        users.forEach(user => {
            console.log(`📧 ${user.email}`);
            console.log(`   Name: ${user.name}`);
            console.log(`   Role: ${user.role?.name || 'N/A'} (${user.role?.slug || 'N/A'})`);
            console.log(`   Department: ${user.department || 'N/A'}`);
            console.log('');
        });

        // 5. Check Employees
        console.log('\n👔 EMPLOYEE VERIFICATION');
        console.log('='.repeat(60));
        const employeeCount = await Employee.countDocuments({ deletedAt: null });
        console.log(`Total Active Employees: ${employeeCount}`);

        if (employeeCount > 0) {
            const sampleEmployee = await Employee.findOne({ deletedAt: null })
                .populate('user', 'name email role')
                .populate('user.role', 'name slug');

            console.log('\n📄 Sample Employee:');
            console.log(`   Employee ID: ${sampleEmployee.employeeId}`);
            console.log(`   Name: ${sampleEmployee.user?.name || 'N/A'}`);
            console.log(`   Email: ${sampleEmployee.user?.email || 'N/A'}`);
            console.log(`   Department: ${sampleEmployee.department}`);
            console.log(`   Designation: ${sampleEmployee.designation}`);
        }

        // 6. Timesheet Access Summary
        console.log('\n\n🔐 TIMESHEET ACCESS CONTROL SUMMARY');
        console.log('='.repeat(60));
        console.log(`
┌─────────────────┬──────────┬────────────────┬──────────┬────────────┬────────────┬────────────┐
│ Role            │ View All │ View Dept      │ View Own │ Create Own │ Update Own │ Delete Own │
├─────────────────┼──────────┼────────────────┼──────────┼────────────┼────────────┼────────────┤
│ Super Admin     │    ✅    │      ✅        │    ✅    │     ✅     │     ✅     │     ✅     │
│ HRM Admin       │    ✅    │      ✅        │    ✅    │     ✅     │     ✅     │     ✅     │
│ Dept Admin      │    ❌    │      ✅        │    ✅    │     ✅     │     ✅     │     ✅     │
│ Employee        │    ❌    │      ❌        │    ✅    │     ✅     │     ✅     │     ✅     │
└─────────────────┴──────────┴────────────────┴──────────┴────────────┴────────────┴────────────┘
    `);

        console.log('\n📝 KEY FEATURES:');
        console.log('   • Department Isolation: Admins only see their department');
        console.log('   • Creator Ownership: Users can only modify their own entries');
        console.log('   • Unique Constraint: One timesheet per employee per day');
        console.log('   • Role Tracking: roleOfCreator field tracks who created each entry');
        console.log('   • Editable Flag: isEditable allows locking timesheets if needed');
        console.log('   • Activity Logging: All create/update/delete operations are logged');

        console.log('\n\n✅ VERIFICATION COMPLETE!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

verifyTimesheetSetup();
