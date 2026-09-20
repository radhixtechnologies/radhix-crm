const Training = require('../../models/Training');
const Employee = require('../../models/Employee');

/**
 * @desc    Get all trainings
 * @route   GET /api/hrm/trainings
 * @access  Private (HRM Module)
 */
exports.getTrainings = async (req, res) => {
    try {
        const { category, type, status, required } = req.query;

        // Build filter
        const filter = {};
        if (category) filter.category = category;
        if (type) filter.type = type;
        if (status) filter.status = status;
        if (required !== undefined) filter.required = required === 'true';

        const trainings = await Training.find(filter)
            .populate('createdBy', 'name email')
            .populate('enrollments.employee', 'firstName lastName email department')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: trainings.length,
            data: trainings,
        });
    } catch (error) {
        console.error('[Training] Error getting trainings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching trainings',
            error: error.message,
        });
    }
};

/**
 * @desc    Get single training
 * @route   GET /api/hrm/trainings/:id
 * @access  Private (HRM Module)
 */
exports.getTraining = async (req, res) => {
    try {
        const training = await Training.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('enrollments.employee', 'firstName lastName email department designation employeeId phone');

        if (!training) {
            return res.status(404).json({
                success: false,
                message: 'Training not found',
            });
        }

        res.json({
            success: true,
            data: training,
        });
    } catch (error) {
        console.error('[Training] Error getting training:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching training',
            error: error.message,
        });
    }
};

/**
 * @desc    Create new training
 * @route   POST /api/hrm/trainings
 * @access  Private (Admin only)
 */
exports.createTraining = async (req, res) => {
    try {
        const trainingData = {
            ...req.body,
            createdBy: req.user._id,
        };

        const training = await Training.create(trainingData);

        res.status(201).json({
            success: true,
            message: 'Training created successfully',
            data: training,
        });
    } catch (error) {
        console.error('[Training] Error creating training:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating training',
            error: error.message,
        });
    }
};

/**
 * @desc    Update training
 * @route   PUT /api/hrm/trainings/:id
 * @access  Private (Admin only)
 */
exports.updateTraining = async (req, res) => {
    try {
        const training = await Training.findById(req.params.id);

        if (!training) {
            return res.status(404).json({
                success: false,
                message: 'Training not found',
            });
        }

        // Update fields
        Object.keys(req.body).forEach(key => {
            if (key !== 'enrollments' && key !== 'createdBy') {
                training[key] = req.body[key];
            }
        });

        training.updatedAt = Date.now();
        await training.save();

        res.json({
            success: true,
            message: 'Training updated successfully',
            data: training,
        });
    } catch (error) {
        console.error('[Training] Error updating training:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating training',
            error: error.message,
        });
    }
};

/**
 * @desc    Enroll in training
 * @route   POST /api/hrm/trainings/:id/enroll
 * @access  Private
 */
exports.enrollInTraining = async (req, res) => {
    try {
        console.log('[ENROLL] Received enrollment request');
        console.log('[ENROLL] Training ID:', req.params.id);
        console.log('[ENROLL] Request body:', req.body);

        const { employeeId } = req.body; // This is actually the user ID from frontend
        const training = await Training.findById(req.params.id);

        if (!training) {
            console.log('[ENROLL] Training not found');
            return res.status(404).json({
                success: false,
                message: 'Training not found',
            });
        }

        console.log('[ENROLL] Training found:', training.title);
        console.log('[ENROLL] Looking up employee by user ID:', employeeId);

        // Find the employee record by user ID
        const employee = await Employee.findOne({ user: employeeId });

        console.log('[ENROLL] Employee lookup result:', employee ? `Found: ${employee.firstName} ${employee.lastName}` : 'Not found');

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee record not found',
            });
        }

        console.log('[ENROLL] Employee ID:', employee._id);

        // Check if training is full
        if (training.maxParticipants && training.enrollments.length >= training.maxParticipants) {
            console.log('[ENROLL] Training is full');
            return res.status(400).json({
                success: false,
                message: 'Training is full',
            });
        }

        // Check if already enrolled (using actual employee ID)
        const alreadyEnrolled = training.enrollments.some(
            enrollment => enrollment.employee.toString() === employee._id.toString()
        );

        if (alreadyEnrolled) {
            console.log('[ENROLL] Employee already enrolled');
            return res.status(400).json({
                success: false,
                message: 'Employee already enrolled in this training',
            });
        }

        console.log('[ENROLL] Adding enrollment...');

        // Add enrollment with correct employee ID
        training.enrollments.push({
            employee: employee._id, // Use the Employee model ID, not User ID
            enrolledAt: Date.now(),
            status: 'pending', // Changed from 'enrolled' to 'pending' for admin approval
        });

        await training.save();

        console.log('[ENROLL] Enrollment saved successfully');
        console.log('[ENROLL] Total enrollments:', training.enrollments.length);

        res.json({
            success: true,
            message: 'Successfully enrolled in training',
            data: training,
        });
    } catch (error) {
        console.error('[ENROLL] Error enrolling in training:', error);
        res.status(500).json({
            success: false,
            message: 'Error enrolling in training',
            error: error.message,
        });
    }
};

/**
 * @desc    Update enrollment status
 * @route   PUT /api/hrm/trainings/:id/enrollments/:enrollmentId
 * @access  Private (Admin or enrolled employee)
 */
exports.updateEnrollment = async (req, res) => {
    try {
        const { id, enrollmentId } = req.params;
        const { status, completionDate, certificateUrl, rating, feedback } = req.body;

        const training = await Training.findById(id);

        if (!training) {
            return res.status(404).json({
                success: false,
                message: 'Training not found',
            });
        }

        const enrollment = training.enrollments.id(enrollmentId);

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Enrollment not found',
            });
        }

        // Update enrollment fields
        if (status) enrollment.status = status;
        if (completionDate) enrollment.completionDate = completionDate;
        if (certificateUrl) enrollment.certificateUrl = certificateUrl;
        if (rating) enrollment.rating = rating;
        if (feedback) enrollment.feedback = feedback;

        training.updatedAt = Date.now();
        await training.save();

        // Populate employee details for the response
        await training.populate('enrollments.employee', 'firstName lastName email department designation employeeId phone');

        res.json({
            success: true,
            message: 'Enrollment updated successfully',
            data: training,
        });
    } catch (error) {
        console.error('[Training] Error updating enrollment:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating enrollment',
            error: error.message,
        });
    }
};

/**
 * @desc    Get training catalog (for employees to browse)
 * @route   GET /api/hrm/trainings/catalog
 * @access  Private
 */
exports.getTrainingCatalog = async (req, res) => {
    try {
        const { category, type } = req.query;

        // Build filter - only show scheduled and in-progress trainings
        const filter = {
            status: { $in: ['scheduled', 'in-progress'] },
        };

        if (category) filter.category = category;
        if (type) filter.type = type;

        const trainings = await Training.find(filter)
            .select('-enrollments.feedback -enrollments.rating')
            .populate('createdBy', 'name email')
            .sort({ 'schedule.startDate': 1 });

        // Add enrollment count and availability
        const catalog = trainings.map(training => {
            const trainingObj = training.toObject();
            trainingObj.enrollmentCount = training.enrollments.length;
            trainingObj.spotsAvailable = training.maxParticipants
                ? training.maxParticipants - training.enrollments.length
                : null;
            return trainingObj;
        });

        res.json({
            success: true,
            count: catalog.length,
            data: catalog,
        });
    } catch (error) {
        console.error('[Training] Error getting training catalog:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching training catalog',
            error: error.message,
        });
    }
};
