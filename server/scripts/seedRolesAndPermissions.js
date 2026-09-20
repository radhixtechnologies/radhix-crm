const mongoose = require('mongoose');
const Permission = require('../models/Permission');
const Role = require('../models/Role');
require('dotenv').config();

/**
 * Seed script to create system roles and permissions
 * Run this script once to initialize the permission system
 */

async function seedRolesAndPermissions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm');
    console.log('Connected to MongoDB');

    // Clear existing permissions and roles (optional - comment out if you want to preserve existing data)
    // await Permission.deleteMany({});
    // await Role.deleteMany({});
    // console.log('Cleared existing permissions and roles');

    // ==================== CREATE PERMISSIONS ====================
    console.log('\n📝 Creating Permissions...');

    const permissions = [];

    // Employee Module Permissions
    const employeePermissions = [
      { name: 'view_own_profile', displayName: 'View Own Profile', module: 'employee', resource: 'profile', action: 'read', scope: 'own' },
      { name: 'edit_own_profile', displayName: 'Edit Own Profile', module: 'employee', resource: 'profile', action: 'update', scope: 'own' },
      { name: 'view_employees', displayName: 'View Employees', module: 'employee', resource: 'employees', action: 'read', scope: 'all' },
      { name: 'view_team_employees', displayName: 'View Team Employees', module: 'employee', resource: 'employees', action: 'read', scope: 'team' },
      { name: 'view_dept_employees', displayName: 'View Department Employees', module: 'employee', resource: 'employees', action: 'read', scope: 'department' },
      { name: 'create_employee', displayName: 'Create Employee', module: 'employee', resource: 'employees', action: 'create', scope: 'all' },
      { name: 'update_employee', displayName: 'Update Employee', module: 'employee', resource: 'employees', action: 'update', scope: 'all' },
      { name: 'delete_employee', displayName: 'Delete Employee', module: 'employee', resource: 'employees', action: 'delete', scope: 'all' },
      { name: 'export_employees', displayName: 'Export Employees', module: 'employee', resource: 'employees', action: 'export', scope: 'all' },
    ];

    // Sales Module Permissions
    const salesPermissions = [
      { name: 'view_leads', displayName: 'View Leads', module: 'sales', resource: 'leads', action: 'read', scope: 'all' },
      { name: 'view_own_leads', displayName: 'View Own Leads', module: 'sales', resource: 'leads', action: 'read', scope: 'own' },
      { name: 'create_lead', displayName: 'Create Lead', module: 'sales', resource: 'leads', action: 'create', scope: 'all' },
      { name: 'update_lead', displayName: 'Update Lead', module: 'sales', resource: 'leads', action: 'update', scope: 'all' },
      { name: 'delete_lead', displayName: 'Delete Lead', module: 'sales', resource: 'leads', action: 'delete', scope: 'all' },
      { name: 'view_deals', displayName: 'View Deals', module: 'sales', resource: 'deals', action: 'read', scope: 'all' },
      { name: 'view_own_deals', displayName: 'View Own Deals', module: 'sales', resource: 'deals', action: 'read', scope: 'own' },
      { name: 'create_deal', displayName: 'Create Deal', module: 'sales', resource: 'deals', action: 'create', scope: 'all' },
      { name: 'update_deal', displayName: 'Update Deal', module: 'sales', resource: 'deals', action: 'update', scope: 'all' },
      { name: 'delete_deal', displayName: 'Delete Deal', module: 'sales', resource: 'deals', action: 'delete', scope: 'all' },
      { name: 'export_sales_data', displayName: 'Export Sales Data', module: 'sales', resource: 'reports', action: 'export', scope: 'all' },
    ];

    // HRM Module Permissions
    const hrmPermissions = [
      { name: 'view_attendance', displayName: 'View Attendance', module: 'hrm', resource: 'attendance', action: 'read', scope: 'all' },
      { name: 'view_own_attendance', displayName: 'View Own Attendance', module: 'hrm', resource: 'attendance', action: 'read', scope: 'own' },
      { name: 'mark_attendance', displayName: 'Mark Attendance', module: 'hrm', resource: 'attendance', action: 'create', scope: 'own' },
      { name: 'manage_attendance', displayName: 'Manage Attendance', module: 'hrm', resource: 'attendance', action: 'manage', scope: 'all' },
      { name: 'view_leaves', displayName: 'View Leaves', module: 'hrm', resource: 'leaves', action: 'read', scope: 'all' },
      { name: 'view_own_leaves', displayName: 'View Own Leaves', module: 'hrm', resource: 'leaves', action: 'read', scope: 'own' },
      { name: 'apply_leave', displayName: 'Apply Leave', module: 'hrm', resource: 'leaves', action: 'create', scope: 'own' },
      { name: 'approve_leave', displayName: 'Approve Leave', module: 'hrm', resource: 'leaves', action: 'approve', scope: 'all' },
      { name: 'view_recruitment', displayName: 'View Recruitment', module: 'hrm', resource: 'recruitment', action: 'read', scope: 'all' },
      { name: 'manage_recruitment', displayName: 'Manage Recruitment', module: 'hrm', resource: 'recruitment', action: 'manage', scope: 'all' },
      { name: 'view_payroll', displayName: 'View Payroll', module: 'hrm', resource: 'payroll', action: 'read', scope: 'all' },
      { name: 'manage_payroll', displayName: 'Manage Payroll', module: 'hrm', resource: 'payroll', action: 'manage', scope: 'all' },
    ];

    // Finance Module Permissions
    const financePermissions = [
      { name: 'view_expenses', displayName: 'View Expenses', module: 'finance', resource: 'expenses', action: 'read', scope: 'all' },
      { name: 'view_own_expenses', displayName: 'View Own Expenses', module: 'finance', resource: 'expenses', action: 'read', scope: 'own' },
      { name: 'create_expense', displayName: 'Create Expense', module: 'finance', resource: 'expenses', action: 'create', scope: 'own' },
      { name: 'approve_expense', displayName: 'Approve Expense', module: 'finance', resource: 'expenses', action: 'approve', scope: 'all' },
      { name: 'view_invoices', displayName: 'View Invoices', module: 'finance', resource: 'invoices', action: 'read', scope: 'all' },
      { name: 'create_invoice', displayName: 'Create Invoice', module: 'finance', resource: 'invoices', action: 'create', scope: 'all' },
      { name: 'update_invoice', displayName: 'Update Invoice', module: 'finance', resource: 'invoices', action: 'update', scope: 'all' },
      { name: 'delete_invoice', displayName: 'Delete Invoice', module: 'finance', resource: 'invoices', action: 'delete', scope: 'all' },
      { name: 'view_reports', displayName: 'View Financial Reports', module: 'finance', resource: 'reports', action: 'read', scope: 'all' },
      { name: 'export_finance_data', displayName: 'Export Finance Data', module: 'finance', resource: 'reports', action: 'export', scope: 'all' },
    ];

    // Settings Module Permissions
    const settingsPermissions = [
      { name: 'view_users', displayName: 'View Users', module: 'settings', resource: 'users', action: 'read', scope: 'all' },
      { name: 'create_user', displayName: 'Create User', module: 'settings', resource: 'users', action: 'create', scope: 'all' },
      { name: 'update_user', displayName: 'Update User', module: 'settings', resource: 'users', action: 'update', scope: 'all' },
      { name: 'delete_user', displayName: 'Delete User', module: 'settings', resource: 'users', action: 'delete', scope: 'all' },
      { name: 'manage_roles', displayName: 'Manage Roles', module: 'settings', resource: 'roles', action: 'manage', scope: 'all' },
      { name: 'manage_permissions', displayName: 'Manage Permissions', module: 'settings', resource: 'permissions', action: 'manage', scope: 'all' },
    ];

    // Dashboard Module Permissions
    const dashboardPermissions = [
      { name: 'view_dashboard', displayName: 'View Dashboard', module: 'dashboard', resource: 'dashboard', action: 'read', scope: 'all' },
      { name: 'view_analytics', displayName: 'View Analytics', module: 'dashboard', resource: 'analytics', action: 'read', scope: 'all' },
    ];

    // Inventory Module Permissions (Operations)
    const inventoryPermissions = [
      { name: 'view_inventory', displayName: 'View Inventory', module: 'inventory', resource: 'products', action: 'read', scope: 'all' },
      { name: 'create_product', displayName: 'Create Product', module: 'inventory', resource: 'products', action: 'create', scope: 'all' },
      { name: 'update_product', displayName: 'Update Product', module: 'inventory', resource: 'products', action: 'update', scope: 'all' },
      { name: 'delete_product', displayName: 'Delete Product', module: 'inventory', resource: 'products', action: 'delete', scope: 'all' },
      { name: 'manage_stock', displayName: 'Manage Stock', module: 'inventory', resource: 'stock', action: 'manage', scope: 'all' },
      { name: 'export_inventory', displayName: 'Export Inventory', module: 'inventory', resource: 'reports', action: 'export', scope: 'all' },
    ];

    // Support Module Permissions (Management)
    const supportPermissions = [
      { name: 'view_tickets', displayName: 'View Support Tickets', module: 'support', resource: 'tickets', action: 'read', scope: 'all' },
      { name: 'view_own_tickets', displayName: 'View Own Tickets', module: 'support', resource: 'tickets', action: 'read', scope: 'own' },
      { name: 'create_ticket', displayName: 'Create Ticket', module: 'support', resource: 'tickets', action: 'create', scope: 'all' },
      { name: 'update_ticket', displayName: 'Update Ticket', module: 'support', resource: 'tickets', action: 'update', scope: 'all' },
      { name: 'assign_ticket', displayName: 'Assign Ticket', module: 'support', resource: 'tickets', action: 'assign', scope: 'all' },
      { name: 'close_ticket', displayName: 'Close Ticket', module: 'support', resource: 'tickets', action: 'close', scope: 'all' },
      { name: 'export_support_data', displayName: 'Export Support Data', module: 'support', resource: 'reports', action: 'export', scope: 'all' },
    ];

    // Combine all permissions
    const allPermissions = [
      ...employeePermissions,
      ...salesPermissions,
      ...hrmPermissions,
      ...financePermissions,
      ...settingsPermissions,
      ...dashboardPermissions,
      ...inventoryPermissions,
      ...supportPermissions,
    ];

    // Insert permissions
    for (const perm of allPermissions) {
      const existing = await Permission.findOne({ name: perm.name });
      if (!existing) {
        const created = await Permission.create(perm);
        permissions.push(created);
        console.log(`✓ Created permission: ${perm.name}`);
      } else {
        permissions.push(existing);
        console.log(`- Permission already exists: ${perm.name}`);
      }
    }

    console.log(`\n✅ Total permissions: ${permissions.length}`);

    // ==================== CREATE ROLES ====================
    console.log('\n👥 Creating Roles...');

    // Helper function to get permission IDs by names
    const getPermissionIds = (permNames) => {
      return permissions
        .filter((p) => permNames.includes(p.name))
        .map((p) => p._id);
    };

    // 1. Super Admin Role - All permissions
    const superAdminRole = await createOrUpdateRole({
      name: 'Super Admin',
      slug: 'super_admin',
      description: 'Full system access with all permissions',
      permissions: permissions.map((p) => p._id),
      modules: ['dashboard', 'employee', 'finance', 'sales', 'hrm', 'settings'],
      isSystem: true,
      level: 100,
    });

    // 2. Admin Role - All permissions except system management
    const adminPermissions = permissions
      .filter((p) => !['manage_roles', 'manage_permissions'].includes(p.name))
      .map((p) => p._id);

    const adminRole = await createOrUpdateRole({
      name: 'Admin',
      slug: 'admin',
      description: 'Administrative access with module-based restrictions',
      permissions: adminPermissions,
      modules: ['dashboard', 'employee', 'finance', 'sales', 'hrm', 'settings'],
      isSystem: true,
      level: 80,
    });

    // 3. Sales Employee Role
    const salesEmployeeRole = await createOrUpdateRole({
      name: 'Sales Employee',
      slug: 'sales_employee',
      description: 'Sales module access with own profile management',
      permissions: getPermissionIds([
        'view_own_profile', 'edit_own_profile',
        'view_own_leads', 'create_lead', 'update_lead',
        'view_own_deals', 'create_deal', 'update_deal',
        'view_own_attendance', 'mark_attendance',
        'view_own_leaves', 'apply_leave',
        'view_own_expenses', 'create_expense',
        'view_dashboard',
      ]),
      modules: ['dashboard', 'employee', 'sales'],
      isSystem: true,
      level: 10,
    });

    // 4. Sales Manager Role
    const salesManagerRole = await createOrUpdateRole({
      name: 'Sales Manager',
      slug: 'sales_manager',
      description: 'Full sales module access with team management',
      permissions: getPermissionIds([
        'view_own_profile', 'edit_own_profile',
        'view_team_employees',
        'view_leads', 'create_lead', 'update_lead', 'delete_lead',
        'view_deals', 'create_deal', 'update_deal', 'delete_deal',
        'export_sales_data',
        'view_own_attendance', 'mark_attendance',
        'view_own_leaves', 'apply_leave',
        'approve_leave',
      ]),
      modules: ['dashboard', 'employee', 'sales'],
      isSystem: true,
      level: 50,
    });

    // 5. HRM Employee Role
    const hrmEmployeeRole = await createOrUpdateRole({
      name: 'HRM Employee',
      slug: 'hrm_employee',
      description: 'HRM module access with own profile management',
      permissions: getPermissionIds([
        'view_own_profile', 'edit_own_profile',
        'view_attendance', 'view_own_attendance', 'mark_attendance',
        'view_leaves', 'view_own_leaves', 'apply_leave',
        'view_recruitment',
        'view_dashboard',
      ]),
      modules: ['dashboard', 'employee', 'hrm'],
      isSystem: true,
      level: 10,
    });

    // 6. HRM Admin Role
    const hrmAdminRole = await createOrUpdateRole({
      name: 'HRM Admin',
      slug: 'hrm_admin',
      description: 'Full HRM module access with employee management',
      permissions: getPermissionIds([
        'view_own_profile', 'edit_own_profile',
        'view_employees', 'create_employee', 'update_employee', 'delete_employee', 'export_employees',
        'view_attendance', 'manage_attendance',
        'view_leaves', 'approve_leave',
        'view_recruitment', 'manage_recruitment',
        'view_payroll', 'manage_payroll',
      ]),
      modules: ['dashboard', 'employee', 'hrm'],
      isSystem: true,
      level: 50,
    });

    // 7. Finance Employee Role
    const financeEmployeeRole = await createOrUpdateRole({
      name: 'Finance Employee',
      slug: 'finance_employee',
      description: 'Finance module access with own profile management',
      permissions: getPermissionIds([
        'view_own_profile', 'edit_own_profile',
        'view_own_expenses', 'create_expense',
        'view_invoices',
        'view_own_attendance', 'mark_attendance',
        'view_own_leaves', 'apply_leave',
        'view_dashboard',
      ]),
      modules: ['dashboard', 'employee', 'finance'],
      isSystem: true,
      level: 10,
    });

    // 8. Finance Manager Role
    const financeManagerRole = await createOrUpdateRole({
      name: 'Finance Manager',
      slug: 'finance_manager',
      description: 'Full finance module access with approval rights',
      permissions: getPermissionIds([
        'view_own_profile', 'edit_own_profile',
        'view_dept_employees',
        'view_expenses', 'approve_expense',
        'view_invoices', 'create_invoice', 'update_invoice', 'delete_invoice',
        'view_reports', 'export_finance_data',
        'view_own_attendance', 'mark_attendance',
        'view_own_leaves', 'apply_leave',
      ]),
      modules: ['dashboard', 'employee', 'finance'],
      isSystem: true,
      level: 50,
    });

    // 9. Operations Employee Role
    const operationsEmployeeRole = await createOrUpdateRole({
      name: 'Operations Employee',
      slug: 'operations_employee',
      description: 'Inventory/Operations module access with own profile management',
      permissions: getPermissionIds([
        'view_own_profile', 'edit_own_profile',
        'view_inventory', 'create_product', 'update_product',
        'view_own_attendance', 'mark_attendance',
        'view_own_leaves', 'apply_leave',
        'view_dashboard',
      ]),
      modules: ['dashboard', 'employee', 'inventory'],
      isSystem: true,
      level: 10,
    });

    // 10. Operations Manager Role
    const operationsManagerRole = await createOrUpdateRole({
      name: 'Operations Manager',
      slug: 'operations_manager',
      description: 'Full inventory/operations management with team oversight',
      permissions: getPermissionIds([
        'view_own_profile', 'edit_own_profile',
        'view_dept_employees',
        'view_inventory', 'create_product', 'update_product', 'delete_product',
        'manage_stock', 'export_inventory',
        'view_own_attendance', 'mark_attendance',
        'view_own_leaves', 'apply_leave',
        'approve_leave',
      ]),
      modules: ['dashboard', 'employee', 'inventory'],
      isSystem: true,
      level: 50,
    });

    // 11. Management Employee Role
    const managementEmployeeRole = await createOrUpdateRole({
      name: 'Management Employee',
      slug: 'management_employee',
      description: 'Support module access with own profile management',
      permissions: getPermissionIds([
        'view_own_profile', 'edit_own_profile',
        'view_tickets', 'view_own_tickets', 'create_ticket', 'update_ticket',
        'view_own_attendance', 'mark_attendance',
        'view_own_leaves', 'apply_leave',
        'view_dashboard',
      ]),
      modules: ['dashboard', 'employee', 'support'],
      isSystem: true,
      level: 10,
    });

    // 12. Management Admin Role
    const managementAdminRole = await createOrUpdateRole({
      name: 'Management Admin',
      slug: 'management_admin',
      description: 'Full support management with system configuration access',
      permissions: getPermissionIds([
        'view_own_profile', 'edit_own_profile',
        'view_dept_employees',
        'view_tickets', 'create_ticket', 'update_ticket', 'assign_ticket', 'close_ticket',
        'export_support_data',
        'view_own_attendance', 'mark_attendance',
        'view_own_leaves', 'apply_leave',
        'approve_leave',
      ]),
      modules: ['dashboard', 'employee', 'support', 'settings'],
      isSystem: true,
      level: 50,
    });

    // 13. Regular Employee Role (My Profile only)
    const employeeRole = await createOrUpdateRole({
      name: 'Employee',
      slug: 'employee',
      description: 'Basic employee access with own profile management only',
      permissions: getPermissionIds([
        'view_own_profile', 'edit_own_profile',
        'view_own_attendance', 'mark_attendance',
        'view_own_leaves', 'apply_leave',
        'view_own_expenses', 'create_expense',
        'view_dashboard',
      ]),
      modules: ['dashboard', 'employee'],
      isSystem: true,
      level: 10,
    });

    console.log('\n✅ All roles created successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Permissions: ${permissions.length}`);
    console.log(`   - Roles: 13`);
    console.log('\n🎉 Seed completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding roles and permissions:', error);
    process.exit(1);
  }
}

// Helper function to create or update role
async function createOrUpdateRole(roleData) {
  const existing = await Role.findOne({ slug: roleData.slug });
  if (existing) {
    console.log(`- Role already exists: ${roleData.name}`);
    // Update existing role
    existing.permissions = roleData.permissions;
    existing.modules = roleData.modules;
    existing.description = roleData.description;
    existing.level = roleData.level;
    await existing.save();
    return existing;
  } else {
    const role = await Role.create(roleData);
    console.log(`✓ Created role: ${roleData.name}`);
    return role;
  }
}

// Run the seed function
seedRolesAndPermissions();
