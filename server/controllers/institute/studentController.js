const mongoose = require('mongoose');
const Student = require('../../models/Student');
const Course = require('../../models/Course');
const Batch = require('../../models/Batch');
const Lead = require('../../models/Lead');
const InstituteFee = require('../../models/InstituteFee');
const StudentAttendance = require('../../models/StudentAttendance');

const sendError = (res, error) => res.status(error.statusCode || 500).json({ success: false, message: error.message });

const generateStudentId = async () => {
  const currentYear = new Date().getFullYear();
  const count = await Student.countDocuments();
  let candidateId = `STU-${currentYear}-${String(count + 1).padStart(4, '0')}`;
  let exists = await Student.findOne({ studentId: candidateId });
  let counter = 1;
  while (exists) {
    candidateId = `STU-${currentYear}-${String(count + 1 + counter).padStart(4, '0')}`;
    exists = await Student.findOne({ studentId: candidateId });
    counter++;
  }
  return candidateId;
};

// GET /api/institute/students
exports.getStudents = async (req, res) => {
  try {
    const { course, batch, status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (course) query.enrolledCourse = course;
    if (batch) query.enrolledBatch = batch;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }

    const currentPage = Math.max(1, Number(page));
    const pageLimit = Math.min(100, Math.max(1, Number(limit)));

    const [students, total] = await Promise.all([
      Student.find(query)
        .populate('enrolledCourse', 'name code baseFee duration')
        .populate('enrolledBatch', 'name startDate endDate schedule capacity status')
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * pageLimit)
        .limit(pageLimit)
        .lean(),
      Student.countDocuments(query),
    ]);

    // Attach fee summary for each student
    const studentsWithFee = await Promise.all(
      students.map(async (student) => {
        const fee = await InstituteFee.findOne({ student: student._id }).select('totalFee discount finalPayable paidAmount dueAmount status').lean();
        return {
          ...student,
          fee: fee || null,
        };
      })
    );

    res.json({
      success: true,
      data: studentsWithFee,
      total,
      page: currentPage,
      pages: Math.ceil(total / pageLimit),
    });
  } catch (error) {
    sendError(res, error);
  }
};

// GET /api/institute/students/:id
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('enrolledCourse', 'name code description duration baseFee isActive')
      .populate('enrolledBatch', 'name startDate endDate schedule capacity instructor status')
      .populate('inquiry', 'name phone email source courseInterested preferredBatch status createdAt')
      .lean();

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Fetch fee records
    const fee = await InstituteFee.findOne({ student: student._id }).lean();

    // Fetch attendance stats for this student
    const attendanceRecords = await StudentAttendance.find({
      'records.student': student._id,
    }).lean();

    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    attendanceRecords.forEach((att) => {
      const match = att.records.find((r) => String(r.student) === String(student._id));
      if (match) {
        if (match.status === 'present') present++;
        else if (match.status === 'absent') absent++;
        else if (match.status === 'late') late++;
        else if (match.status === 'excused') excused++;
      }
    });

    const totalClasses = present + absent + late + excused;
    const attendanceRate = totalClasses > 0 ? Math.round(((present + late) / totalClasses) * 100) : 100;

    res.json({
      success: true,
      data: {
        ...student,
        fee: fee || null,
        attendanceStats: {
          totalClasses,
          present,
          absent,
          late,
          excused,
          rate: attendanceRate,
        },
      },
    });
  } catch (error) {
    sendError(res, error);
  }
};

// POST /api/institute/students/enroll
exports.enrollStudent = async (req, res) => {
  let createdStudent = null;
  let createdFee = null;
  let originalLeadState = null;

  try {
    const {
      inquiryId,
      name,
      phone,
      email,
      address,
      guardianName,
      guardianPhone,
      educationLevel,
      courseId,
      batchId,
      totalFee: reqTotalFee,
      discount: reqDiscount,
      initialPayment,
      paymentMethod,
      installments: reqInstallments,
    } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Student name is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course selection is required' });
    }
    if (!batchId) {
      return res.status(400).json({ success: false, message: 'Batch selection is required' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    if (String(batch.course) !== String(course._id)) {
      return res.status(400).json({ success: false, message: 'Selected batch does not belong to the selected course' });
    }

    // Capacity check
    const currentEnrolledCount = await Student.countDocuments({
      enrolledBatch: batch._id,
      status: { $in: ['enrolled', 'active'] },
    });
    if (currentEnrolledCount >= batch.capacity) {
      return res.status(400).json({
        success: false,
        message: `Batch "${batch.name}" is already at full capacity (${batch.capacity}/${batch.capacity}).`,
      });
    }

    // If enrolling from an inquiry, guard against duplicate enrollment
    let lead = null;
    if (inquiryId) {
      lead = await Lead.findOne({ _id: inquiryId, isDeleted: { $ne: true } });
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Inquiry record not found' });
      }

      if (lead.convertedToStudent) {
        const existingStudent = await Student.findById(lead.convertedToStudent);
        return res.status(400).json({
          success: false,
          message: `This inquiry is already enrolled as student ${existingStudent?.studentId || 'already enrolled'}. Duplicate enrollment prevented.`,
        });
      }

      originalLeadState = {
        status: lead.status,
        convertedToStudent: lead.convertedToStudent,
        conversionDate: lead.conversionDate,
      };
    }

    // Generate unique Student ID
    const studentId = await generateStudentId();

    // 1. Create Student
    createdStudent = await Student.create({
      studentId,
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      address: address ? address.trim() : '',
      guardianName: guardianName ? guardianName.trim() : '',
      guardianPhone: guardianPhone ? guardianPhone.trim() : '',
      educationLevel: educationLevel ? educationLevel.trim() : (lead?.educationLevel || ''),
      enrolledCourse: course._id,
      enrolledBatch: batch._id,
      inquiry: lead?._id || null,
      enrollmentDate: new Date(),
      status: 'enrolled',
      createdBy: req.user?._id,
    });

    // 2. Setup Fee Plan
    const totalFee = Number(reqTotalFee !== undefined ? reqTotalFee : course.baseFee);
    const discount = Number(reqDiscount || 0);
    const finalPayable = Math.max(0, totalFee - discount);

    let installments = [];
    if (Array.isArray(reqInstallments) && reqInstallments.length > 0) {
      installments = reqInstallments.map((inst, idx) => ({
        installmentNumber: idx + 1,
        dueDate: new Date(inst.dueDate || batch.startDate),
        amount: Number(inst.amount),
        paidAmount: 0,
        status: 'pending',
      }));
    } else {
      // Default single installment
      installments = [{
        installmentNumber: 1,
        dueDate: batch.startDate || new Date(),
        amount: finalPayable,
        paidAmount: 0,
        status: 'pending',
      }];
    }

    let initialPaid = Number(initialPayment || 0);
    if (initialPaid < 0) initialPaid = 0;
    if (initialPaid > finalPayable) initialPaid = finalPayable;

    let receipts = [];
    if (initialPaid > 0) {
      const receiptNumber = `RCP-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
      receipts.push({
        receiptNumber,
        amount: initialPaid,
        paymentMethod: paymentMethod || 'upi',
        transactionReference: 'Initial enrollment payment',
        paidAt: new Date(),
        notes: 'Down payment / enrollment fee',
        recordedBy: req.user?._id,
      });

      // Allocate initial payment to installments
      let remainingAllocation = initialPaid;
      for (const inst of installments) {
        if (remainingAllocation <= 0) break;
        const needed = inst.amount - inst.paidAmount;
        const allocate = Math.min(remainingAllocation, needed);
        inst.paidAmount += allocate;
        remainingAllocation -= allocate;
        if (inst.paidAmount >= inst.amount) {
          inst.status = 'paid';
        } else if (inst.paidAmount > 0) {
          inst.status = 'partial';
        }
      }
    }

    const dueAmount = Math.max(0, finalPayable - initialPaid);
    let feeStatus = 'unpaid';
    if (finalPayable === 0 || dueAmount === 0) feeStatus = 'paid';
    else if (initialPaid > 0) feeStatus = 'partial';

    createdFee = await InstituteFee.create({
      student: createdStudent._id,
      course: course._id,
      batch: batch._id,
      totalFee,
      discount,
      finalPayable,
      paidAmount: initialPaid,
      dueAmount,
      status: feeStatus,
      installments,
      receipts,
      createdBy: req.user?._id,
    });

    // 3. Update Inquiry if linked
    if (lead) {
      lead.convertedToStudent = createdStudent._id;
      lead.status = 'converted';
      lead.conversionDate = new Date();
      lead.course = course._id;
      lead.batch = batch._id;
      lead.courseInterested = course.name;
      lead.preferredBatch = batch.name;

      lead.communicationHistory.push({
        type: 'note',
        description: `Enrolled as Student [${studentId}] in course "${course.name}", batch "${batch.name}".`,
        date: new Date(),
        addedBy: req.user?._id,
      });

      await lead.save();
    }

    const populatedStudent = await Student.findById(createdStudent._id)
      .populate('enrolledCourse', 'name code duration')
      .populate('enrolledBatch', 'name startDate endDate schedule')
      .lean();

    res.status(201).json({
      success: true,
      data: {
        student: populatedStudent,
        fee: createdFee,
      },
      message: `Student ${name} successfully enrolled with ID ${studentId}`,
    });
  } catch (error) {
    // Partial write rollback protection
    if (createdFee) {
      await InstituteFee.findByIdAndDelete(createdFee._id).catch(() => {});
    }
    if (createdStudent) {
      await Student.findByIdAndDelete(createdStudent._id).catch(() => {});
    }
    if (inquiryId && originalLeadState) {
      await Lead.findByIdAndUpdate(inquiryId, originalLeadState).catch(() => {});
    }

    sendError(res, error);
  }
};

// PUT /api/institute/students/:id
exports.updateStudent = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
      guardianName,
      guardianPhone,
      educationLevel,
      status,
      enrolledBatch: newBatchId,
    } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (name) student.name = name.trim();
    if (phone) student.phone = phone.trim();
    if (email !== undefined) student.email = email.trim();
    if (address !== undefined) student.address = address.trim();
    if (guardianName !== undefined) student.guardianName = guardianName.trim();
    if (guardianPhone !== undefined) student.guardianPhone = guardianPhone.trim();
    if (educationLevel !== undefined) student.educationLevel = educationLevel.trim();
    if (status) student.status = status;

    // Batch transfer check
    if (newBatchId && String(newBatchId) !== String(student.enrolledBatch)) {
      const targetBatch = await Batch.findById(newBatchId);
      if (!targetBatch) {
        return res.status(404).json({ success: false, message: 'Target batch not found' });
      }
      const targetBatchCount = await Student.countDocuments({
        enrolledBatch: targetBatch._id,
        status: { $in: ['enrolled', 'active'] },
      });
      if (targetBatchCount >= targetBatch.capacity) {
        return res.status(400).json({
          success: false,
          message: `Target batch "${targetBatch.name}" is already at capacity (${targetBatch.capacity}/${targetBatch.capacity}).`,
        });
      }
      student.enrolledBatch = targetBatch._id;
      // Also update batch in InstituteFee
      await InstituteFee.findOneAndUpdate({ student: student._id }, { batch: targetBatch._id });
    }

    await student.save();

    const populated = await Student.findById(student._id)
      .populate('enrolledCourse', 'name code duration')
      .populate('enrolledBatch', 'name startDate endDate schedule')
      .lean();

    res.json({ success: true, data: populated, message: 'Student profile updated successfully' });
  } catch (error) {
    sendError(res, error);
  }
};

// DELETE /api/institute/students/:id
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Mark as dropped instead of hard delete to preserve financial & attendance history
    student.status = 'dropped';
    await student.save();

    res.json({ success: true, message: 'Student marked as dropped' });
  } catch (error) {
    sendError(res, error);
  }
};
