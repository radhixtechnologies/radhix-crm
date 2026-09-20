const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import Models
const Permission = require('../models/Permission');
const Role = require('../models/Role');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Counter = require('../models/Counter');
const LeaveBalance = require('../models/LeaveBalance');

/**
 * Script to recreate core database essentials:
 * 1. RBAC (Roles & Permissions)
 * 2. Employee Directory (Initial Users & Employees)
 */

async function recreateDatabaseEssentials() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm';
        await mongoose.connect(mongoUri);
        console.log('🚀 Connected to MongoDB at', mongoUri);

        // ==========================================
        // 1. SEED PERMISSIONS
        // ==========================================
        console.log('\n📝 Seeding Permissions...');

        const permissionData = [
            // Dashboard
            { name: 'view_dashboard', displayName: 'View Dashboard', module: 'dashboard', resource: 'dashboard', action: 'read', scope: 'all' },
            { name: 'view_analytics', displayName: 'View Analytics', module: 'dashboard', resource: 'analytics', action: 'read', scope: 'all' },

            // Employee
            { name: 'view_own_profile', displayName: 'View Own Profile', module: 'employee', resource: 'profile', action: 'read', scope: 'own' },
            { name: 'edit_own_profile', displayName: 'Edit Own Profile', module: 'employee', resource: 'profile', action: 'update', scope: 'own' },
            { name: 'view_employees', displayName: 'View Employees', module: 'employee', resource: 'employees', action: 'read', scope: 'all' },
            { name: 'create_employee', displayName: 'Create Employee', module: 'employee', resource: 'employees', action: 'create', scope: 'all' },
            { name: 'update_employee', displayName: 'Update Employee', module: 'employee', resource: 'employees', action: 'update', scope: 'all' },
            { name: 'delete_employee', displayName: 'Delete Employee', module: 'employee', resource: 'employees', action: 'delete', scope: 'all' },

            // Sales
            { name: 'view_leads', displayName: 'View Leads', module: 'sales', resource: 'leads', action: 'read', scope: 'all' },
            { name: 'view_own_leads', displayName: 'View Own Leads', module: 'sales', resource: 'leads', action: 'read', scope: 'own' },
            { name: 'create_lead', displayName: 'Create Lead', module: 'sales', resource: 'leads', action: 'create', scope: 'all' },
            { name: 'update_lead', displayName: 'Update Lead', module: 'sales', resource: 'leads', action: 'update', scope: 'all' },
            { name: 'view_deals', displayName: 'View Deals', module: 'sales', resource: 'deals', action: 'read', scope: 'all' },

            // HRM
            { name: 'view_attendance', displayName: 'View Attendance', module: 'hrm', resource: 'attendance', action: 'read', scope: 'all' },
            { name: 'view_own_attendance', displayName: 'View Own Attendance', module: 'hrm', resource: 'attendance', action: 'read', scope: 'own' },
            { name: 'mark_attendance', displayName: 'Mark Attendance', module: 'hrm', resource: 'attendance', action: 'create', scope: 'own' },
            { name: 'manage_attendance', displayName: 'Manage Attendance', module: 'hrm', resource: 'attendance', action: 'manage', scope: 'all' },
            { name: 'view_leaves', displayName: 'View Leaves', module: 'hrm', resource: 'leaves', action: 'read', scope: 'all' },
            { name: 'view_own_leaves', displayName: 'View Own Leaves', module: 'hrm', resource: 'leaves', action: 'read', scope: 'own' },
            { name: 'apply_leave', displayName: 'Apply Leave', module: 'hrm', resource: 'leaves', action: 'create', scope: 'own' },
            { name: 'approve_leave', displayName: 'Approve Leave', module: 'hrm', resource: 'leaves', action: 'approve', scope: 'all' },

            // Finance
            { name: 'view_expenses', displayName: 'View Expenses', module: 'finance', resource: 'expenses', action: 'read', scope: 'all' },
            { name: 'approve_expense', displayName: 'Approve Expense', module: 'finance', resource: 'expenses', action: 'approve', scope: 'all' },
            { name: 'view_invoices', displayName: 'View Invoices', module: 'finance', resource: 'invoices', action: 'read', scope: 'all' },

            // Settings
            { name: 'view_users', displayName: 'View Users', module: 'settings', resource: 'users', action: 'read', scope: 'all' },
            { name: 'manage_roles', displayName: 'Manage Roles', module: 'settings', resource: 'roles', action: 'manage', scope: 'all' },
        ];

        const permissions = [];
        for (const p of permissionData) {
            let perm = await Permission.findOne({ name: p.name });
            if (!perm) {
                perm = await Permission.create(p);
                console.log(`  ✓ Created: ${p.name}`);
            }
            permissions.push(perm);
        }

        // ==========================================
        // 2. SEED ROLES
        // ==========================================
        console.log('\n👥 Seeding Roles...');

        const getPermIds = (names) => permissions.filter(p => names.includes(p.name)).map(p => p._id);

        const rolesData = [
            {
                name: 'Super Admin',
                slug: 'super_admin',
                description: 'Full system access',
                permissions: permissions.map(p => p._id),
                modules: ['dashboard', 'employee', 'finance', 'sales', 'hrm', 'settings'],
                isSystem: true,
                level: 100
            },
            {
                name: 'Admin',
                slug: 'admin',
                description: 'Administrative access',
                permissions: getPermIds(['view_dashboard', 'view_employees', 'view_leads', 'view_attendance', 'view_leaves']),
                modules: ['dashboard', 'employee', 'sales', 'hrm'],
                isSystem: true,
                level: 80
            },
            {
                name: 'HRM Admin',
                slug: 'hrm_admin',
                description: 'HR Management',
                permissions: getPermIds(['view_dashboard', 'view_employees', 'create_employee', 'update_employee', 'view_attendance', 'manage_attendance', 'view_leaves', 'approve_leave']),
                modules: ['dashboard', 'employee', 'hrm'],
                isSystem: true,
                level: 50
            },
            {
                name: 'Employee',
                slug: 'employee',
                description: 'Standard employee access',
                permissions: getPermIds(['view_own_profile', 'edit_own_profile', 'view_own_attendance', 'mark_attendance', 'view_own_leaves', 'apply_leave', 'view_dashboard']),
                modules: ['dashboard', 'employee'],
                isSystem: true,
                level: 10
            }
        ];

        const roles = {};
        for (const r of rolesData) {
            let role = await Role.findOne({ slug: r.slug });
            if (!role) {
                role = await Role.create(r);
                console.log(`  ✓ Created: ${r.name}`);
            } else {
                // Update permissions for existing role
                role.permissions = r.permissions;
                role.modules = r.modules;
                await role.save();
                console.log(`  - Updated: ${r.name}`);
            }
            roles[r.slug] = role;
        }

        // ==========================================
        // 3. RESET COUNTER (Optional but recommended for clean ID)
        // ==========================================
        const existingCounter = await Counter.findById('employeeId');
        if (!existingCounter) {
            await Counter.create({ _id: 'employeeId', seq: 0 });
        }

        // ==========================================
        // 4. SEED USERS & EMPLOYEES (Employee Directory)
        // ==========================================
        console.log('\n📂 Seeding Employee Directory...');

        const employeeDirectory = [
            {
                name: 'System Admin',
                email: 'admin@zynextro.com',
                password: 'password123',
                roleSlug: 'super_admin',
                department: 'Management',
                designation: 'CEO',
                status: 'active'
            },
            {
                name: 'Harsh Singh',
                email: 'harsh.hr@zynextro.com',
                password: 'password123',
                roleSlug: 'hrm_admin',
                department: 'HR',
                designation: 'HR Manager',
                status: 'active'
            },
            {
                name: 'Sneha Gupta',
                email: 'sneha.sales@zynextro.com',
                password: 'password123',
                roleSlug: 'employee',
                department: 'Sales',
                designation: 'Sales Executive',
                status: 'active'
            },
            {
                name: 'Rahul Varma',
                email: 'rahul.it@zynextro.com',
                password: 'password123',
                roleSlug: 'employee',
                department: 'IT',
                designation: 'Software Engineer',
                status: 'active'
            }
        ];

        for (const data of employeeDirectory) {
            let user = await User.findOne({ email: data.email });
            if (!user) {
                user = new User({
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    role: roles[data.roleSlug]._id,
                    department: data.department,
                    isActive: true
                });
                await user.save();
                console.log(`  ✓ Created User: ${data.name}`);
            } else {
                user.role = roles[data.roleSlug]._id;
                user.department = data.department;
                await user.save();
                console.log(`  - User Exists: ${data.name}`);
            }

            // Check for Employee Record
            let employee = await Employee.findOne({ user: user._id });
            if (!employee) {
                // Increment Counter manually for IDs
                const counter = await Counter.findByIdAndUpdate(
                    { _id: 'employeeId' },
                    { $inc: { seq: 1 } },
                    { new: true }
                );

                const year = new Date().getFullYear().toString().slice(-2);
                const deptMap = { 'IT': 'DEV', 'HR': 'HR', 'Sales': 'MKT', 'Management': 'MGMT' };
                const deptCode = deptMap[data.department] || 'GENT';
                const empIdStr = `ZY${year}/ND/${deptCode}/${String(counter.seq).padStart(4, '0')}`;

                employee = await Employee.create({
                    user: user._id,
                    employeeId: empIdStr,
                    department: data.department,
                    designation: data.designation,
                    status: data.status,
                    joiningDate: new Date(),
                    employmentType: 'full-time'
                });
                console.log(`    ✓ Created Employee Record: ${empIdStr}`);

                // Seed Leave Balance
                await LeaveBalance.create({
                    employee: employee._id,
                    year: new Date().getFullYear(),
                    balances: {
                        casual: { total: 12, available: 12, used: 0 },
                        sick: { total: 10, available: 10, used: 0 },
                        annual: { total: 15, available: 15, used: 0 },
                    }
                });
                console.log(`    ✓ Initialized Leave Balances`);
            } else {
                console.log(`    - Employee Record Already Exists`);
            }
        }

        console.log('\n✨ Database Re-initialization Complete!');
        console.log('-------------------------------------------');
        console.log('Default credentials for all accounts:');
        console.log('Username: [Their Email]');
        console.log('Password: password123');
        console.log('-------------------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error during re-initialization:', error);
        process.exit(1);
    }
}

recreateDatabaseEssentials();
