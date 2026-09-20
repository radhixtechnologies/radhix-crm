const mongoose = require('mongoose');

console.log('Mongoose version:', mongoose.version);
const MONGO_URI = "mongodb+srv://zynextro:Zynextro%40123@ac-syjyvex-shard-00-00.pvqz3nt.mongodb.net/Zynextro?retryWrites=true&w=majority";

async function testConnect() {
    try {
        console.log('Connecting to:', MONGO_URI.substring(0, 20) + '...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected!');
        await mongoose.disconnect();
    } catch (error) {
        console.error('Connection failed:', error);
    }
}

testConnect();
