const { MongoClient } = require('mongodb');
require('dotenv').config();

const SOURCE_URI = 'mongodb+srv://charu1:charu@zynextro.pvqz3nt.mongodb.net/Zynextro?appName=Zynextro';
const DEST_URI = 'mongodb+srv://charu1:charu@zynextro.pvqz3nt.mongodb.net/Zynextrolive?appName=Zynextro';

// Collections to migrate in order
const COLLECTIONS = [
    'permissions',
    'roles',
    'counters',
    'users',
    'employees',
    'leavebalances'
];

async function runMigration() {
    const sourceClient = new MongoClient(SOURCE_URI);
    const destClient = new MongoClient(DEST_URI);

    try {
        console.log('🔌 Connecting to Source and Destination...');
        await sourceClient.connect();
        await destClient.connect();

        const sourceDb = sourceClient.db(); // This connects to 'Zynextro' based on the URI
        const destDb = destClient.db();     // This connects to 'Zynextrolive' based on the URI

        console.log(`✅ Connected! Source: ${sourceDb.databaseName}, Destination: ${destDb.databaseName}`);

        for (const collName of COLLECTIONS) {
            console.log(`\n📦 Migrating collection: ${collName}...`);

            const sourceColl = sourceDb.collection(collName);
            const destColl = destDb.collection(collName);

            // Get all documents from source
            const docs = await sourceColl.find({}).toArray();

            if (docs.length === 0) {
                console.log(`  - No documents found in ${collName}. Skipping.`);
                continue;
            }

            console.log(`  - Found ${docs.length} documents in source.`);

            // Optional: Clear destination collection first to avoid duplicates
            // If you want to merge, you'd use upsert. Since we want "EXACTLY SAME", we replace.
            await destColl.deleteMany({});
            console.log(`  - Cleared destination ${collName}.`);

            // Bulk insert
            const result = await destColl.insertMany(docs);
            console.log(`  ✓ Successfully migrated ${result.insertedCount} documents to ${collName}.`);
        }

        console.log('\n✨ ALL DATA MIGRATED SUCCESSFULLY!');
        console.log('Users, Employees, Roles, and Leave Balances are now identical to the old database.');

    } catch (error) {
        console.error('\n❌ FATAL ERROR DURING MIGRATION:', error);
    } finally {
        await sourceClient.close();
        await destClient.close();
        process.exit(0);
    }
}

runMigration();
