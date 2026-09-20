// Quick script to check user and verify password
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

const checkUser = async () => {
  try {
    await connectDB();

    const user = await User.findOne({ email: 'admin@zynextro.com' }).select('+password');
    
    if (!user) {
      console.log('User not found! Creating user...');
      
      // Create user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      const newUser = await User.create({
        name: 'Super Admin',
        email: 'admin@zynextro.com',
        password: hashedPassword,
        role: 'super_admin',
        modulesAccess: {},
        isActive: true,
      });

      console.log('User created successfully!');
      console.log('Email:', newUser.email);
      console.log('Role:', newUser.role);
    } else {
      console.log('User found:');
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Password hash:', user.password.substring(0, 20) + '...');
      
      // Test password
      const testPassword = 'admin123';
      const isMatch = await bcrypt.compare(testPassword, user.password);
      console.log('Password match test:', isMatch ? '✅ CORRECT' : '❌ INCORRECT');
      
      if (!isMatch) {
        console.log('\nPassword mismatch! Updating password...');
        user.password = 'admin123'; // Set plain text - pre-save hook will hash it
        user.markModified('password'); // Force mark as modified
        await user.save();
        console.log('Password updated! Re-testing...');
        // Re-test password
        await user.populate(); // Refresh user
        const newMatch = await bcrypt.compare('admin123', user.password);
        console.log('New password test:', newMatch ? '✅ CORRECT' : '❌ INCORRECT');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkUser();

