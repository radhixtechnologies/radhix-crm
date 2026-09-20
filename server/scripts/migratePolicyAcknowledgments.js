const mongoose = require('mongoose');
const Policy = require('../models/Policy');
const PolicyAcknowledgment = require('../models/PolicyAcknowledgment');

/**
 * Migration Script: Migrate Policy Acknowledgments
 * 
 * This script migrates embedded acknowledgments from the old Policy model
 * to the new PolicyAcknowledgment collection.
 * 
 * Run this script once after deploying the new policy models.
 */

async function migratePolicyAcknowledgments() {
    try {
        console.log('Starting policy acknowledgment migration...\n');

        // Connect to database if not already connected
        if (mongoose.connection.readyState === 0) {
            const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/crm';
            await mongoose.connect(dbUri);
            console.log('Connected to database');
        }

        // Find all policies with embedded acknowledgments
        const policies = await Policy.find({
            acknowledgements: { $exists: true, $ne: [] }
        });

        console.log(`Found ${policies.length} policies with acknowledgments\n`);

        let totalMigrated = 0;
        let totalSkipped = 0;
        let errors = 0;

        for (const policy of policies) {
            console.log(`\nProcessing policy: ${policy.title} (v${policy.version})`);
            console.log(`  - ${policy.acknowledgements.length} acknowledgments to migrate`);

            for (const ack of policy.acknowledgements) {
                try {
                    // Check if acknowledgment already exists in new collection
                    const existing = await PolicyAcknowledgment.findOne({
                        policy: policy._id,
                        policyVersion: policy.versionNumber || 1,
                        employee: ack.employee,
                    });

                    if (existing) {
                        console.log(`  - Skipped: Acknowledgment already exists for employee ${ack.employee}`);
                        totalSkipped++;
                        continue;
                    }

                    // Create new acknowledgment record
                    await PolicyAcknowledgment.create({
                        policy: policy._id,
                        policyVersion: policy.versionNumber || 1,
                        policyTitle: policy.title,
                        employee: ack.employee,
                        acknowledgedAt: ack.acknowledgedAt || new Date(),
                        ipAddress: ack.ipAddress || '',
                        userAgent: ack.userAgent || '',
                        status: 'acknowledged',
                    });

                    totalMigrated++;
                    console.log(`  ✓ Migrated acknowledgment for employee ${ack.employee}`);
                } catch (error) {
                    errors++;
                    console.error(`  ✗ Error migrating acknowledgment: ${error.message}`);
                }
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('Migration Summary:');
        console.log('='.repeat(60));
        console.log(`Total acknowledgments migrated: ${totalMigrated}`);
        console.log(`Total acknowledgments skipped: ${totalSkipped}`);
        console.log(`Total errors: ${errors}`);
        console.log('='.repeat(60));

        if (errors === 0) {
            console.log('\n✓ Migration completed successfully!');
            console.log('\nNext steps:');
            console.log('1. Verify the migrated data in PolicyAcknowledgment collection');
            console.log('2. Test policy acknowledgment functionality');
            console.log('3. Once verified, you can optionally remove the acknowledgements field from Policy documents');
        } else {
            console.log('\n⚠ Migration completed with errors. Please review the errors above.');
        }

        return {
            success: errors === 0,
            totalMigrated,
            totalSkipped,
            errors,
        };
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
}

// Run migration if executed directly
if (require.main === module) {
    migratePolicyAcknowledgments()
        .then(() => {
            console.log('\nClosing database connection...');
            mongoose.connection.close();
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration error:', error);
            mongoose.connection.close();
            process.exit(1);
        });
}

module.exports = migratePolicyAcknowledgments;
