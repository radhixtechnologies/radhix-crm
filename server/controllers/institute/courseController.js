const Course = require('../../models/Course');
const Batch = require('../../models/Batch');

const sendError = (res, error) => res.status(error.statusCode || 500).json({ success: false, message: error.message });

// GET /api/institute/courses
exports.getCourses = async (req, res) => {
  try {
    const { search, isActive } = req.query;
    const query = {};

    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const courses = await Course.find(query).sort({ name: 1 }).lean();

    // Optionally count batches for each course
    const coursesWithBatchCount = await Promise.all(
      courses.map(async (course) => {
        const batchCount = await Batch.countDocuments({ course: course._id });
        const activeBatchCount = await Batch.countDocuments({ course: course._id, status: { $in: ['upcoming', 'active'] } });
        return {
          ...course,
          batchCount,
          activeBatchCount,
        };
      })
    );

    res.json({ success: true, data: coursesWithBatchCount });
  } catch (error) {
    sendError(res, error);
  }
};

// GET /api/institute/courses/:id
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    const batches = await Batch.find({ course: course._id }).sort({ startDate: -1 }).lean();
    res.json({ success: true, data: { ...course.toObject(), batches } });
  } catch (error) {
    sendError(res, error);
  }
};

// POST /api/institute/courses
exports.createCourse = async (req, res) => {
  try {
    const { name, code, description, duration, baseFee, isActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Course name is required' });
    }
    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Course code is required' });
    }
    if (!duration || !duration.trim()) {
      return res.status(400).json({ success: false, message: 'Course duration is required' });
    }
    if (baseFee === undefined || baseFee === null || Number(baseFee) < 0) {
      return res.status(400).json({ success: false, message: 'Valid base fee (>= 0) is required' });
    }

    const existing = await Course.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: `Course with code "${code.trim().toUpperCase()}" already exists` });
    }

    const course = await Course.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description ? description.trim() : '',
      duration: duration.trim(),
      baseFee: Number(baseFee),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdBy: req.user?._id,
    });

    res.status(201).json({ success: true, data: course, message: 'Course created successfully' });
  } catch (error) {
    sendError(res, error);
  }
};

// PUT /api/institute/courses/:id
exports.updateCourse = async (req, res) => {
  try {
    const { name, code, description, duration, baseFee, isActive } = req.body;

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (code && code.trim().toUpperCase() !== course.code) {
      const duplicate = await Course.findOne({
        _id: { $ne: course._id },
        code: code.trim().toUpperCase(),
      });
      if (duplicate) {
        return res.status(400).json({ success: false, message: `Course code "${code.trim().toUpperCase()}" is already in use` });
      }
      course.code = code.trim().toUpperCase();
    }

    if (name) course.name = name.trim();
    if (description !== undefined) course.description = description.trim();
    if (duration) course.duration = duration.trim();
    if (baseFee !== undefined) {
      if (Number(baseFee) < 0) {
        return res.status(400).json({ success: false, message: 'Base fee cannot be negative' });
      }
      course.baseFee = Number(baseFee);
    }
    if (isActive !== undefined) course.isActive = Boolean(isActive);

    await course.save();
    res.json({ success: true, data: course, message: 'Course updated successfully' });
  } catch (error) {
    sendError(res, error);
  }
};

// DELETE /api/institute/courses/:id
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if course has batches
    const batchCount = await Batch.countDocuments({ course: course._id });
    if (batchCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete course with ${batchCount} existing batch(es). Consider deactivating it instead.`,
      });
    }

    await Course.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    sendError(res, error);
  }
};
