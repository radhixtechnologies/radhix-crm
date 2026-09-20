/**
 * Check Deal State
 * Verifies the assignedTo field and population for a specific deal
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Define schemas inline
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

async function checkDeal() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) throw new Error('MONGODB_URI not found');

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Find the deal without populate first to see raw ID
        const deal = await Deal.findOne({ title: /Ankit Kumar/i });

        if (!deal) {
            console.log('❌ Deal not found');
        } else {
            console.log('📊 Deal Found:', deal.title);
            console.log('   ID:', deal._id);

            const assignedToId = deal.get('assignedTo');
            console.log('   Raw assignedTo ID:', assignedToId);

            if (assignedToId) {
                // Check if this ID exists in User collection
                const user = await User.findById(assignedToId);
                if (user) {
                    console.log('   ✅ User found:', user.name, user.email);
                } else {
                    console.log('   ❌ User NOT found with ID:', assignedToId);

                    // Check if it's still an Employee ID
                    const Employee = mongoose.model('Employee', new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId }, { strict: false }));
                    const emp = await Employee.findById(assignedToId);
                    if (emp) {
                        console.log('   ⚠️  It is still an Employee ID!');
                        console.log('      Linked User ID:', emp.user);
                    }
                }
            } else {
                console.log('   ⚠️  assignedTo field is missing or null');
            }
        }


    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

checkDeal();
