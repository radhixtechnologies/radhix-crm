const mongoose = require('mongoose');

const MONGO_URI = "mongodb+srv://zynextro:Zynextro%40123@ac-syjyvex-shard-00-00.pvqz3nt.mongodb.net/Zynextro?retryWrites=true&w=majority";

async function checkIndexes() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('leavebalances');
        const indexes = await collection.indexes();
        console.log('Indexes on leavebalances:', JSON.stringify(indexes, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkIndexes();
