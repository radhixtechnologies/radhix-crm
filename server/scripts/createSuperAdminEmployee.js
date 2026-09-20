/**
 * Script to create an Employee record for Super Admin
 * Run this script to create an employee profile for the super admin user
 * 
 * Usage: node server/scripts/createSuperAdminEmployee.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Employee = require('../models/Employee');
const LeaveBalance = require('../models/LeaveBalance');
const { generateEmployeeId } = require('../utils/employeeHelper');

async function createSuperAdminEmployee() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Find super admin user
    const superAdmin = await User.findOne({ role: 'super_admin' });
    
    if (!superAdmin) {
      console.error('Super admin user not found. Please create a super admin user first.');
      process.exit(1);
    }

    console.log(`Found super admin: ${superAdmin.name} (${superAdmin.email})`);

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ user: superAdmin._id });
    if (existingEmployee) {
      console.log(`Employee record already exists for super admin:`);
      console.log(`  Employee ID: ${existingEmployee.employeeId}`);
      console.log(`  Name: ${existingEmployee.user?.name || superAdmin.name}`);
      console.log(`  Department: ${existingEmployee.department}`);
      console.log(`  Designation: ${existingEmployee.designation}`);
      process.exit(0);
    }

    // Generate employee ID
    const employeeId = await generateEmployeeId('Management');

    // Create employee record
    const employeeData = {
      user: superAdmin._id,
      employeeId: employeeId,
      department: 'Management',
      designation: 'Super Administrator',
      status: 'active',
      accessLevel: 'admin',
      joiningDate: new Date(),
      workLocation: 'office',
      employmentType: 'full-time',
      probationStatus: 'completed',
    };

    const employee = await Employee.create(employeeData);
    console.log(`\n✅ Employee record created successfully!`);
    console.log(`  Employee ID: ${employee.employeeId}`);
    console.log(`  Name: ${superAdmin.name}`);
    console.log(`  Email: ${superAdmin.email}`);
    console.log(`  Department: ${employee.department}`);
    console.log(`  Designation: ${employee.designation}`);

    // Create leave balance for the employee
    const currentYear = new Date().getFullYear();
    const leaveBalance = await LeaveBalance.findOne({ 
      employee: employee._id, 
      year: currentYear 
    });

    if (!leaveBalance) {
      await LeaveBalance.create({
        employee: employee._id,
        year: currentYear,
        balances: {
          casual: { total: 12, available: 12, used: 0 },
          sick: { total: 10, available: 10, used: 0 },
          annual: { total: 15, available: 15, used: 0 },
        },
      });
      console.log(`  Leave balance created for ${currentYear}`);
    } else {
      console.log(`  Leave balance already exists for ${currentYear}`);
    }

    console.log(`\n✨ Super admin can now use attendance features!`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating super admin employee:', error);
    process.exit(1);
  }
}

// Run the script
createSuperAdminEmployee();

