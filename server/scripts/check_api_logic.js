/**
 * Check API Response Logic
 * Simulates how the controller fetches and populates data
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Define schemas to match actual server
const dealSchema = new mongoose.Schema({
    title: String,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { strict: false });

const userSchema = new mongoose.Schema({
    name: String,
    email: String
}, { strict: false });

const Deal = mongoose.model('Deal', dealSchema);
const User = mongoose.model('User', userSchema);

async function checkApiLogic() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected');

        // Find the deal
        const deal = await Deal.findOne({ title: /Ankit Kumar/i });
        console.log('📊 Deal ID:', deal._id);

        // Simulate controller logic: .populate('assignedTo', 'name email')
        const populatedDeal = await Deal.findById(deal._id)
            .populate('assignedTo', 'name email');

        console.log('🔍 Simulated API Response:');
        console.log(JSON.stringify({
            title: populatedDeal.title,
            assignedTo: populatedDeal.assignedTo
        }, null, 2));

        if (populatedDeal.assignedTo && populatedDeal.assignedTo.name) {
            console.log('✅ SUCCESS: Owner name is populated!');
        } else {
            console.log('❌ FAILURE: Owner name is MISSING!');
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.connection.close();
    }
}

checkApiLogic();
