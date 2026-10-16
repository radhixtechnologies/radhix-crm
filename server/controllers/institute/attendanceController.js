const StudentAttendance = require('../../models/StudentAttendance');
const Batch = require('../../models/Batch');
const Student = require('../../models/Student');

const sendError = (res, error) => res.status(error.statusCode || 500).json({ success: false, message: error.message });

const normalizeDate = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
};

// GET /api/institute/attendance/roster/:batchId
exports.getBatchRoster = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { date } = req.query;

    const batch = await Batch.findById(batchId)
      .populate('course', 'name code duration')
      .lean();

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const targetDate = normalizeDate(date);

    // Get all enrolled students in this batch
    const students = await Student.find({
      enrolledBatch: batch._id,
      status: { $in: ['enrolled', 'active'] },
    })
      .select('studentId name phone email status')
      .sort({ name: 1 })
      .lean();

    // Check if attendance already marked for this date
    const existingAttendance = await StudentAttendance.findOne({
      batch: batch._id,
      date: targetDate,
    }).lean();

    const existingMap = new Map();
    if (existingAttendance && Array.isArray(existingAttendance.records)) {
      existingAttendance.records.forEach((r) => {
        existingMap.set(String(r.student), r);
      });
    }

    const roster = students.map((student) => {
      const record = existingMap.get(String(student._id));
      return {
        student,
        status: record ? record.status : 'present',
        remarks: record ? record.remarks : '',
      };
    });

    res.json({
      success: true,
      data: {
        batch,
        date: targetDate,
        isAlreadyMarked: !!existingAttendance,
        markedAt: existingAttendance?.updatedAt || null,
        roster,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
};

// POST /api/institute/attendance
exports.saveBatchAttendance = async (req, res) => {
  try {
    const { batchId, date, records } = req.body;

    if (!batchId) {
      return res.status(400).json({ success: false, message: 'Batch ID is required' });
    }
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'Attendance records are required' });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const targetDate = normalizeDate(date);

    // Deduplicate student records if any
    const seenStudents = new Set();
    const cleanRecords = [];
    for (const item of records) {
      if (item.student && !seenStudents.has(String(item.student))) {
        seenStudents.add(String(item.student));
        cleanRecords.push({
          student: item.student,
          status: ['present', 'absent', 'late', 'excused'].includes(item.status) ? item.status : 'present',
          remarks: item.remarks ? String(item.remarks).trim() : '',
        });
      }
    }

    // Atomic upsert to prevent duplicate attendance sheet for the batch & date
    const attendance = await StudentAttendance.findOneAndUpdate(
      { batch: batch._id, date: targetDate },
      {
        batch: batch._id,
        date: targetDate,
        records: cleanRecords,
        markedBy: req.user?._id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      data: attendance,
      message: `Attendance for "${batch.name}" on ${targetDate.toISOString().slice(0, 10)} saved successfully`,
    });
  } catch (error) {
    sendError(res, error);
  }
};

// GET /api/institute/attendance/history
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { batchId, startDate, endDate } = req.query;
    const query = {};

    if (batchId) query.batch = batchId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = normalizeDate(startDate);
      if (endDate) query.date.$lte = normalizeDate(endDate);
    }

    const history = await StudentAttendance.find(query)
      .populate('batch', 'name schedule')
      .populate('markedBy', 'name email')
      .sort({ date: -1 })
      .lean();

    const formatted = history.map((h) => {
      let present = 0;
      let absent = 0;
      let late = 0;
      let excused = 0;
      (h.records || []).forEach((r) => {
        if (r.status === 'present') present++;
        else if (r.status === 'absent') absent++;
        else if (r.status === 'late') late++;
        else if (r.status === 'excused') excused++;
      });
      const total = present + absent + late + excused;
      return {
        _id: h._id,
        batch: h.batch,
        date: h.date,
        markedBy: h.markedBy,
        totalStudents: total,
        present,
        absent,
        late,
        excused,
        attendanceRate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    sendError(res, error);
  }
};
