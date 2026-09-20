// Seed script to create initial Super Admin user
// Run with: node server/config/seed.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zynextro-crm');
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

const seedSuperAdmin = async () => {
  try {
    await connectDB();

    // Check if super admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@zynextro.com' });
    if (existingAdmin) {
      console.log('Super Admin already exists');
      process.exit(0);
    }

    // Create super admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'admin@zynextro.com',
      password: hashedPassword,
      role: 'super_admin',
      modulesAccess: {},
      isActive: true,
    });

    console.log('Super Admin created successfully:');
    console.log('Email: admin@zynextro.com');
    console.log('Password: admin123');
    console.log('Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding:', error);
    process.exit(1);
  }
};

seedSuperAdmin();

