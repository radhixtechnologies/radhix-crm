
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const AppraisalCycle = require('../models/AppraisalCycle');
const User = require('../models/User');

const checkPerformanceData = async () => {
    await connectDB();

    try {
        console.log("Testing AppraisalCycle query with populate...");
        const cycles = await AppraisalCycle.find({})
            .populate({
                path: 'createdBy',
                select: 'name email',
                strictPopulate: false,
            });

        console.log(`Total Appraisal Cycles: ${cycles.length}`);
        cycles.forEach(c => {
            console.log(`- ${c.name} [${c.type}] Status: '${c.status}'`);
            console.log(`  Created By: ${c.createdBy ? c.createdBy.name : 'NULL'}`);
        });

    } catch (error) {
        console.error(`Error executing query: ${error.message}`);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

checkPerformanceData();
