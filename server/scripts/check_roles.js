const mongoose = require('mongoose');
require('dotenv').config();
const Role = require('../models/Role');

async function checkRoles() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const roles = await Role.find({}).select('name slug modules isActive');

        console.log('=== All Roles in Database ===\n');
        roles.forEach(role => {
            console.log(`Role: ${role.name} (${role.slug})`);
            console.log(`  Active: ${role.isActive}`);
            console.log(`  Modules: ${role.modules.length > 0 ? role.modules.join(', ') : 'NONE'}`);
            console.log('');
        });

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit(0);
    }
}

checkRoles();
