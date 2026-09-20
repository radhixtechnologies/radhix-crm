const JobApplication = require('../../models/JobApplication');
const { asyncHandler } = require('../../utils/asyncHandler');

/**
 * @desc    Fix corrupted interviewHistory fields (one-time migration)
 * @route   POST /api/hrm/admin/fix-interview-history
 * @access  Private (Super Admin only)
 */
exports.fixInterviewHistory = asyncHandler(async (req, res) => {
    try {
        console.log('\n=== Starting Interview History Fix ===\n');

        // Get the collection directly to bypass model validation
        const db = JobApplication.db.db;
        const collection = db.collection('jobapplications');

        // Find all documents where interviewHistory is not an array
        const corruptedDocs = await collection.find({
            $or: [
                { interviewHistory: { $type: 'string' } },
                { interviewHistory: { $type: 'object', $not: { $type: 'array' } } },
                { interviewHistory: null }
            ]
        }).toArray();

        console.log(`Found ${corruptedDocs.length} documents with corrupted interviewHistory`);

        let fixedCount = 0;
        const fixedApplicants = [];

        // Fix each document
        for (const doc of corruptedDocs) {
            console.log(`\nFixing applicant: ${doc.applicantName} (${doc._id})`);
            console.log(`  Current type: ${typeof doc.interviewHistory}`);

            const result = await collection.updateOne(
                { _id: doc._id },
                { $set: { interviewHistory: [] } }
            );

            if (result.modifiedCount > 0) {
                fixedCount++;
                fixedApplicants.push({
                    id: doc._id,
                    name: doc.applicantName,
                    email: doc.email
                });
                console.log(`  ✓ Fixed`);
            }
        }

        // Also ensure all documents have the field
        const missingDocs = await collection.find({
            interviewHistory: { $exists: false }
        }).toArray();

        console.log(`\nFound ${missingDocs.length} documents missing interviewHistory field`);

        for (const doc of missingDocs) {
            await collection.updateOne(
                { _id: doc._id },
                { $set: { interviewHistory: [] } }
            );
            fixedCount++;
            fixedApplicants.push({
                id: doc._id,
                name: doc.applicantName,
                email: doc.email
            });
        }

        console.log(`\n=== Fix Complete ===`);
        console.log(`Total documents fixed: ${fixedCount}`);

        res.status(200).json({
            success: true,
            message: 'Interview history fields fixed successfully',
            data: {
                totalCorrupted: corruptedDocs.length,
                totalMissing: missingDocs.length,
                totalFixed: fixedCount,
                fixedApplicants
            }
        });

    } catch (error) {
        console.error('Error fixing interview history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fix interview history',
            error: error.message
        });
    }
});
