/**
 * Debug script to check users and verify credentials
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const outputFile = path.join(__dirname, 'debug-users.txt');

let output = '';
const log = (msg) => {
    console.log(msg);
    output += msg + '\n';
};

async function debugUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        log('Connected to MongoDB\n');

        const User = require('../models/User');

        // List all users with their creation dates
        log('--- All Users ---');
        const users = await User.find({}).select('name email isActive createdAt role').sort({ createdAt: -1 });

        users.forEach((u, i) => {
            log(`${i + 1}. Email: ${u.email}`);
            log(`   Name: ${u.name}`);
            log(`   Active: ${u.isActive}`);
            log(`   Created: ${u.createdAt}`);
            log(`   Role: ${u.role}`);
            log('');
        });

        log(`\nTotal users: ${users.length}`);

        fs.writeFileSync(outputFile, output);
        console.log(`\nOutput written to: ${outputFile}`);

    } catch (error) {
        log('Error: ' + error.message);
        fs.writeFileSync(outputFile, output);
    } finally {
        await mongoose.disconnect();
    }
}

debugUsers();
