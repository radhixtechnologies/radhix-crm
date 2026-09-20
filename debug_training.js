
const mongoose = require('mongoose');
const Training = require('./server/models/Training');
require('dotenv').config({ path: './server/.env' });

const checkTrainings = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const trainings = await Training.find({}).select('title status createdBy');
        console.log('All Trainings:');
        trainings.forEach(t => {
            console.log(`- ID: ${t._id}, Title: "${t.title}", Status: "${t.status}", CreatedBy: ${t.createdBy}`);
        });

        // Simulate getTrainingCatalog query
        const catalog = await Training.find({
            status: { $in: ['scheduled', 'in-progress'] }
        });
        console.log('\nTraining Catalog Query (status in [scheduled, in-progress]):');
        console.log(`Found ${catalog.length} items.`);
        catalog.forEach(t => {
            console.log(`- ID: ${t._id}, Title: "${t.title}", Status: "${t.status}"`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkTrainings();
