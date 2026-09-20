const mongoose = require('mongoose');
const LeaveBalance = require('./models/LeaveBalance');

const MONGO_URI = "mongodb+srv://zynextro:Zynextro%40123@ac-syjyvex-shard-00-00.pvqz3nt.mongodb.net/Zynextro?retryWrites=true&w=majority";

async function syncIndexes() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        console.log('Syncing indexes for LeaveBalance...');
        await LeaveBalance.syncIndexes();
        console.log('Indexes synced successfully.');

        const indexes = await LeaveBalance.collection.indexes();
        console.log('Current Indexes:', JSON.stringify(indexes, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

syncIndexes();
