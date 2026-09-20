const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');
const Role = require('../models/Role');

dotenv.config();

const createSuperAdmin = async () => {
  try {
    await connectDB();

    const superAdminRole = await Role.findOne({ slug: 'super_admin' });
    if (!superAdminRole) {
      console.error('Error: super_admin role not found. Please run seedRolesAndPermissions.js first.');
      process.exit(1);
    }

    const email = 'superadmin@example.com';
    const password = 'password123'; // Hardcoded initial password
    const name = 'Super Admin';

    let user = await User.findOne({ email });

    if (user) {
      console.log('Super Admin user already exists.');
      
      // Update role if execution is forced, otherwise just notify
      // Uncomment to force update:
      // user.role = superAdminRole._id;
      // await user.save();
      // console.log('Super Admin role updated.');
    } else {
      user = await User.create({
        name,
        email,
        password,
        role: superAdminRole._id,
        modulesAccess: {
          employee: true,
          finance: true,
          sales: true,
          hrm: true,
        },
      });
      console.log('Super Admin user created successfully.');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error creating Super Admin:', error);
    process.exit(1);
  }
};

createSuperAdmin();
