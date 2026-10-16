const Batch = require('../../models/Batch');
const Course = require('../../models/Course');
const Student = require('../../models/Student');

const sendError = (res, error) => res.status(error.statusCode || 500).json({ success: false, message: error.message });

// GET /api/institute/batches
exports.getBatches = async (req, res) => {
  try {
    const { course, status, search } = req.query;
    const query = {};

    if (course) {
      query.course = course;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const batches = await Batch.find(query)
      .populate('course', 'name code baseFee duration isActive')
      .sort({ startDate: -1 })
      .lean();

    // Attach student enrollment count
    const batchesWithCounts = await Promise.all(
      batches.map(async (batch) => {
        const enrolledCount = await Student.countDocuments({
          enrolledBatch: batch._id,
          status: { $in: ['enrolled', 'active'] },
        });
        const availableSeats = Math.max(0, batch.capacity - enrolledCount);
        return {
          ...batch,
          enrolledCount,
          availableSeats,
          isFull: enrolledCount >= batch.capacity,
        };
      })
    );

    res.json({ success: true, data: batchesWithCounts });
  } catch (error) {
    sendError(res, error);
  }
};

// GET /api/institute/batches/:id
exports.getBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('course', 'name code baseFee duration isActive')
      .lean();

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const enrolledCount = await Student.countDocuments({
      enrolledBatch: batch._id,
      status: { $in: ['enrolled', 'active'] },
    });
    const students = await Student.find({ enrolledBatch: batch._id })
      .select('studentId name email phone status enrollmentDate')
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      data: {
        ...batch,
        enrolledCount,
        availableSeats: Math.max(0, batch.capacity - enrolledCount),
        isFull: enrolledCount >= batch.capacity,
        students,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
};

// POST /api/institute/batches
exports.createBatch = async (req, res) => {
  try {
    const { name, course: courseId, startDate, endDate, schedule, capacity, instructor, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Batch name is required' });
    }
    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course is required' });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start and end dates are required' });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid start or end date' });
    }
    if (end < start) {
      return res.status(400).json({ success: false, message: 'End date cannot be earlier than start date' });
    }
    if (!schedule || !schedule.trim()) {
      return res.status(400).json({ success: false, message: 'Schedule details are required' });
    }
    if (!capacity || Number(capacity) < 1) {
      return res.status(400).json({ success: false, message: 'Capacity must be at least 1' });
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Referenced course does not exist' });
    }

    const batch = await Batch.create({
      name: name.trim(),
      course: course._id,
      startDate: start,
      endDate: end,
      schedule: schedule.trim(),
      capacity: Math.floor(Number(capacity)),
      instructor: instructor ? instructor.trim() : '',
      status: status || 'upcoming',
      createdBy: req.user?._id,
    });

    await batch.populate('course', 'name code baseFee duration');
    res.status(201).json({ success: true, data: batch, message: 'Batch created successfully' });
  } catch (error) {
    sendError(res, error);
  }
};

// PUT /api/institute/batches/:id
exports.updateBatch = async (req, res) => {
  try {
    const { name, course: courseId, startDate, endDate, schedule, capacity, instructor, status } = req.body;

    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    if (courseId && courseId !== String(batch.course)) {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Referenced course does not exist' });
      }
      batch.course = course._id;
    }

    const start = startDate ? new Date(startDate) : batch.startDate;
    const end = endDate ? new Date(endDate) : batch.endDate;
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid start or end date' });
    }
    if (end < start) {
      return res.status(400).json({ success: false, message: 'End date cannot be earlier than start date' });
    }
    batch.startDate = start;
    batch.endDate = end;

    if (name) batch.name = name.trim();
    if (schedule) batch.schedule = schedule.trim();
    if (instructor !== undefined) batch.instructor = instructor.trim();
    if (status) batch.status = status;

    if (capacity !== undefined) {
      const cap = Math.floor(Number(capacity));
      if (cap < 1) {
        return res.status(400).json({ success: false, message: 'Capacity must be at least 1' });
      }
      // Check if capacity is smaller than currently enrolled students
      const currentEnrolled = await Student.countDocuments({
        enrolledBatch: batch._id,
        status: { $in: ['enrolled', 'active'] },
      });
      if (cap < currentEnrolled) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce capacity to ${cap} because ${currentEnrolled} active students are currently enrolled.`,
        });
      }
      batch.capacity = cap;
    }

    await batch.save();
    await batch.populate('course', 'name code baseFee duration');
    res.json({ success: true, data: batch, message: 'Batch updated successfully' });
  } catch (error) {
    sendError(res, error);
  }
};

// DELETE /api/institute/batches/:id
exports.deleteBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    // Check if students enrolled
    const studentCount = await Student.countDocuments({ enrolledBatch: batch._id });
    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete batch with ${studentCount} enrolled student(s). Change batch status to cancelled or transfer students first.`,
      });
    }

    await Batch.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Batch deleted successfully' });
  } catch (error) {
    sendError(res, error);
  }
};
