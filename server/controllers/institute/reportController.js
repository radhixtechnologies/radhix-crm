const Lead = require('../../models/Lead');
const Student = require('../../models/Student');
const Course = require('../../models/Course');
const Batch = require('../../models/Batch');
const InstituteFee = require('../../models/InstituteFee');
const FollowUp = require('../../models/FollowUp');

const sendError = (res, error) => res.status(error.statusCode || 500).json({ success: false, message: error.message });

// GET /api/institute/reports/overview
exports.getOverviewReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    // Inquiries stats
    const inquiryQuery = { isInstituteInquiry: true, isDeleted: { $ne: true }, ...dateFilter };
    const allInquiries = await Lead.find(inquiryQuery).select('status convertedToStudent course batch createdAt').lean();

    const stageBreakdown = {
      new: allInquiries.filter((i) => i.status === 'new').length,
      contacted: allInquiries.filter((i) => i.status === 'contacted').length,
      qualified: allInquiries.filter((i) => i.status === 'qualified').length,
      converted: allInquiries.filter((i) => i.status === 'converted').length,
      lost: allInquiries.filter((i) => i.status === 'lost').length,
    };

    const totalInquiries = allInquiries.length;
    const convertedFromInquiries = allInquiries.filter((i) => i.status === 'converted' || i.convertedToStudent).length;
    const conversionRate = totalInquiries > 0 ? Math.round((convertedFromInquiries / totalInquiries) * 100) : 0;

    // Follow-ups stats
    const inquiryIds = allInquiries.map((i) => i._id);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const followUps = await FollowUp.find({
      type: 'lead',
      relatedId: { $in: inquiryIds },
    }).select('status scheduledDate').lean();

    const followUpStats = {
      total: followUps.length,
      completed: followUps.filter((f) => f.status === 'completed').length,
      pending: followUps.filter((f) => f.status === 'pending').length,
      overdue: followUps.filter((f) => f.status === 'pending' && new Date(f.scheduledDate) < startOfToday).length,
      dueToday: followUps.filter((f) => {
        const d = new Date(f.scheduledDate);
        return f.status === 'pending' && d >= startOfToday && d <= endOfToday;
      }).length,
    };

    // Course admissions & popularity
    const courses = await Course.find().select('name code baseFee duration').lean();
    const courseStats = await Promise.all(
      courses.map(async (course) => {
        const enrolledCount = await Student.countDocuments({ enrolledCourse: course._id });
        const courseInquiries = allInquiries.filter((i) => String(i.course) === String(course._id)).length;
        return {
          _id: course._id,
          name: course.name,
          code: course.code,
          baseFee: course.baseFee,
          inquiries: courseInquiries,
          enrolledCount,
        };
      })
    );

    // Batch capacity & occupancy
    const batches = await Batch.find().populate('course', 'name code').select('name course capacity status startDate endDate').lean();
    const batchStats = await Promise.all(
      batches.map(async (batch) => {
        const enrolledCount = await Student.countDocuments({
          enrolledBatch: batch._id,
          status: { $in: ['enrolled', 'active'] },
        });
        const occupancyRate = batch.capacity > 0 ? Math.round((enrolledCount / batch.capacity) * 100) : 0;
        return {
          _id: batch._id,
          name: batch.name,
          courseName: batch.course?.name || 'Unknown',
          capacity: batch.capacity,
          enrolledCount,
          occupancyRate,
          status: batch.status,
        };
      })
    );

    // Financial totals
    const fees = await InstituteFee.find().select('finalPayable paidAmount dueAmount status').lean();
    const feeStats = {
      totalBilled: fees.reduce((acc, f) => acc + (f.finalPayable || 0), 0),
      totalCollected: fees.reduce((acc, f) => acc + (f.paidAmount || 0), 0),
      totalOutstanding: fees.reduce((acc, f) => acc + (f.dueAmount || 0), 0),
      collectionRate:
        fees.reduce((acc, f) => acc + (f.finalPayable || 0), 0) > 0
          ? Math.round(
              (fees.reduce((acc, f) => acc + (f.paidAmount || 0), 0) /
                fees.reduce((acc, f) => acc + (f.finalPayable || 0), 0)) *
                100
            )
          : 0,
      paidCount: fees.filter((f) => f.status === 'paid').length,
      partialCount: fees.filter((f) => f.status === 'partial').length,
      unpaidCount: fees.filter((f) => f.status === 'unpaid').length,
    };

    // Overall total students
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ status: { $in: ['enrolled', 'active'] } });

    res.json({
      success: true,
      data: {
        totalInquiries,
        stageBreakdown,
        conversionRate,
        convertedFromInquiries,
        totalStudents,
        activeStudents,
        followUpStats,
        courseStats,
        batchStats,
        feeStats,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
};
