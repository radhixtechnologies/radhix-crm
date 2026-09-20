const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const Employee = require('../models/Employee');
require('dotenv').config();

/**
 * Migration script to convert existing users to new Role-based system
 * This script:
 * 1. Assigns appropriate roles to existing users based on their current role
 * 2. Maps modulesAccess to corresponding roles
 * 3. Preserves user data and access levels
 */

async function migrateUsersToRoles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm');
    console.log('Connected to MongoDB');

    // Get all roles
    const roles = await Role.find({});
    const roleMap = {};
    roles.forEach((role) => {
      roleMap[role.slug] = role;
    });

    console.log('\n📋 Available Roles:');
    Object.keys(roleMap).forEach((slug) => {
      console.log(`   - ${roleMap[slug].name} (${slug})`);
    });

    // Get all users
    const users = await User.find({});
    console.log(`\n👥 Found ${users.length} users to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      // Skip if user already has a role assigned (ObjectId)
      if (user.role && mongoose.Types.ObjectId.isValid(user.role)) {
        console.log(`- Skipping ${user.email} (already migrated)`);
        skippedCount++;
        continue;
      }

      const oldRole = user.role || user.legacyRole;
      let newRole = null;
      let department = null;

      // Get employee record to determine department
      const employee = await Employee.findOne({ user: user._id });
      if (employee) {
        department = employee.department;
      }

      // Determine new role based on old role and modulesAccess
      if (oldRole === 'super_admin') {
        newRole = roleMap['super_admin'];
        console.log(`✓ Migrating ${user.email}: super_admin → Super Admin`);
      } else if (oldRole === 'admin') {
        // Check modulesAccess to determine specific admin role
        const modules = user.modulesAccess || {};
        
        // If admin has all modules, assign Admin role
        if (modules.employee && modules.finance && modules.sales && modules.hrm) {
          newRole = roleMap['admin'];
          console.log(`✓ Migrating ${user.email}: admin (all modules) → Admin`);
        }
        // If admin has only HRM module, assign HRM Admin
        else if (modules.hrm && !modules.sales && !modules.finance) {
          newRole = roleMap['hrm_admin'];
          console.log(`✓ Migrating ${user.email}: admin (HRM only) → HRM Admin`);
        }
        // If admin has only Sales module, assign Sales Manager
        else if (modules.sales && !modules.hrm && !modules.finance) {
          newRole = roleMap['sales_manager'];
          console.log(`✓ Migrating ${user.email}: admin (Sales only) → Sales Manager`);
        }
        // If admin has only Finance module, assign Finance Manager
        else if (modules.finance && !modules.hrm && !modules.sales) {
          newRole = roleMap['finance_manager'];
          console.log(`✓ Migrating ${user.email}: admin (Finance only) → Finance Manager`);
        }
        // Default to Admin role
        else {
          newRole = roleMap['admin'];
          console.log(`✓ Migrating ${user.email}: admin (mixed modules) → Admin`);
        }
      } else if (oldRole === 'employee') {
        // Determine employee role based on department
        if (department === 'Sales') {
          newRole = roleMap['sales_employee'];
          console.log(`✓ Migrating ${user.email}: employee (Sales dept) → Sales Employee`);
        } else if (department === 'HR') {
          newRole = roleMap['hrm_employee'];
          console.log(`✓ Migrating ${user.email}: employee (HR dept) → HRM Employee`);
        } else if (department === 'Finance') {
          newRole = roleMap['finance_employee'];
          console.log(`✓ Migrating ${user.email}: employee (Finance dept) → Finance Employee`);
        } else {
          // Default to regular Employee role
          newRole = roleMap['employee'];
          console.log(`✓ Migrating ${user.email}: employee (${department || 'no dept'}) → Employee`);
        }
      } else if (oldRole === 'candidate') {
        // Candidates get basic employee access
        newRole = roleMap['employee'];
        console.log(`✓ Migrating ${user.email}: candidate → Employee`);
      } else {
        // Default to Employee role
        newRole = roleMap['employee'];
        console.log(`✓ Migrating ${user.email}: unknown role → Employee`);
      }

      if (newRole) {
        // Save legacy role for reference
        user.legacyRole = oldRole;
        // Assign new role
        user.role = newRole._id;
        // Set department if available
        if (department) {
          user.department = department;
        }
        await user.save();
        migratedCount++;
      } else {
        console.log(`⚠ Could not find appropriate role for ${user.email}`);
        skippedCount++;
      }
    }

    console.log('\n✅ Migration completed!');
    console.log(`   - Migrated: ${migratedCount}`);
    console.log(`   - Skipped: ${skippedCount}`);
    console.log(`   - Total: ${users.length}`);

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const verifyUsers = await User.find({}).populate('role');
    let verifiedCount = 0;
    let failedCount = 0;

    for (const user of verifyUsers) {
      if (user.role && user.role.name) {
        verifiedCount++;
      } else {
        console.log(`❌ User ${user.email} has no valid role`);
        failedCount++;
      }
    }

    console.log(`\n✓ Verified: ${verifiedCount}/${verifyUsers.length} users have valid roles`);
    if (failedCount > 0) {
      console.log(`⚠ Warning: ${failedCount} users have invalid roles`);
    }

    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error migrating users:', error);
    process.exit(1);
  }
}

// Run the migration
migrateUsersToRoles();
