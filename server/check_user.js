const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Role = require('./models/Role');
const User = require('./models/User');
const Company = require('./models/Company');
const Employee = require('./models/Employee');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: 'apex@gmail.com' }).populate('role company');
        console.log('USER:', user ? {
            _id: user._id,
            email: user.email,
            name: user.name,
            role: user.role?.slug || user.role,
            company: user.company
        } : 'Not found');

        const allEmps = await Employee.find({ deletedAt: null }).select('_id employeeId company user').lean();
        console.log('COMPANY ALLOWED SUITES:', user.company?.subscription?.allowedSuites);
        console.log('COMPANY INDUSTRY:', user.company?.industry);
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
