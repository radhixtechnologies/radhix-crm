const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import Models
const User = require('../models/User');
const Employee = require('../models/Employee');
const Role = require('../models/Role');

async function exportEmployees() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const employees = await Employee.find().populate('user').populate('user.role');

        const exportData = employees.map(emp => {
            if (!emp.user) return null;
            return {
                name: emp.user.name,
                email: emp.user.email,
                department: emp.department,
                designation: emp.designation,
                status: emp.status,
                roleSlug: emp.user.role ? emp.user.role.slug : 'employee'
            };
        }).filter(e => e !== null);

        const outputPath = path.join(__dirname, 'exported_employees.json');
        fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

        console.log(`\n✅ Exported ${exportData.length} employees to:`);
        console.log(outputPath);
        console.log('\nYou can copy this data into the recreate_db_essentials.js script to preserve exact data.');

        process.exit(0);
    } catch (error) {
        console.error('Error exporting employees:', error);
        process.exit(1);
    }
}

exportEmployees();
