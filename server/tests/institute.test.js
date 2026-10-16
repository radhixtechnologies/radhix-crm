require('dotenv').config();
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

// Models
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const Student = require('../models/Student');
const InstituteFee = require('../models/InstituteFee');
const StudentAttendance = require('../models/StudentAttendance');
const Lead = require('../models/Lead');
const FollowUp = require('../models/FollowUp');
const User = require('../models/User');

// Controllers
const courseCtrl = require('../controllers/institute/courseController');
const batchCtrl = require('../controllers/institute/batchController');
const followupCtrl = require('../controllers/institute/followupController');
const studentCtrl = require('../controllers/institute/studentController');
const feeCtrl = require('../controllers/institute/feeController');
const attendanceCtrl = require('../controllers/institute/attendanceController');
const reportCtrl = require('../controllers/institute/reportController');

// Mock req and res helper
const mockResponse = () => {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
};

describe('Institute Admissions MVP Test Suite', () => {
  let testUser;
  let testCourse;
  let testBatch;
  let testLead;

  before(async () => {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (mongoUri && mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      } catch (err) {
        console.warn('MongoDB connection failed in test runner; skipping live DB tests if DB is offline:', err.message);
      }
    }

    if (mongoose.connection.readyState === 1) {
      // Create mock user
      testUser = await User.findOne() || await User.create({
        name: 'Institute Admin',
        email: `inst_admin_${Date.now()}@example.com`,
        password: 'password123',
        role: 'admin',
        isActive: true,
      });
    }
  });

  after(async () => {
    if (mongoose.connection.readyState === 1) {
      if (testCourse) await Course.findByIdAndDelete(testCourse._id);
      if (testBatch) await Batch.findByIdAndDelete(testBatch._id);
      if (testLead) await Lead.findByIdAndDelete(testLead._id);
      await mongoose.disconnect();
    }
  });

  describe('1. Courses & Batches', () => {
    test('Course model validation: requires name, code, duration, baseFee', () => {
      const invalidCourse = new Course({});
      const err = invalidCourse.validateSync();
      assert.ok(err, 'Validation should fail for empty course');
      assert.ok(err.errors.name, 'Course name is required');
      assert.ok(err.errors.code, 'Course code is required');
      assert.ok(err.errors.duration, 'Duration is required');
      assert.ok(err.errors.baseFee, 'Base fee is required');
    });

    test('Course creation via controller rejects invalid base fee', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const req = {
        body: { name: 'Full Stack Web Dev', code: 'TEST-FSWD', duration: '3 Months', baseFee: -500 },
        user: testUser,
      };
      const res = mockResponse();
      await courseCtrl.createCourse(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.data.success, false);
    });

    test('Batch creation rejects end date earlier than start date', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const req = {
        body: {
          name: 'Invalid Dates Batch',
          course: new mongoose.Types.ObjectId(),
          startDate: '2026-06-01',
          endDate: '2026-05-01',
          schedule: 'Mon-Fri 10am',
          capacity: 25,
        },
        user: testUser,
      };
      const res = mockResponse();
      await batchCtrl.createBatch(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.match(res.data.message, /earlier than start date/i);
    });

    test('Batch creation rejects capacity less than 1', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const req = {
        body: {
          name: 'Zero Cap Batch',
          course: new mongoose.Types.ObjectId(),
          startDate: '2026-06-01',
          endDate: '2026-09-01',
          schedule: 'Mon-Fri 10am',
          capacity: 0,
        },
        user: testUser,
      };
      const res = mockResponse();
      await batchCtrl.createBatch(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.match(res.data.message, /Capacity must be at least 1/i);
    });
  });

  describe('2. Student Enrollment & Safety', () => {
    test('Student model requires studentId, name, phone, course, batch', () => {
      const student = new Student({});
      const err = student.validateSync();
      assert.ok(err, 'Validation should fail for empty student');
      assert.ok(err.errors.studentId);
      assert.ok(err.errors.name);
      assert.ok(err.errors.phone);
      assert.ok(err.errors.enrolledCourse);
      assert.ok(err.errors.enrolledBatch);
    });

    test('Duplicate enrollment prevention: already enrolled inquiry is rejected', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      // Create test course & batch
      testCourse = await Course.create({
        name: 'Data Science Bootcamp',
        code: `DS-${Date.now()}`,
        duration: '6 Months',
        baseFee: 35000,
      });

      testBatch = await Batch.create({
        name: 'Batch Alpha',
        course: testCourse._id,
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-12-31'),
        schedule: 'Weekends 10am-2pm',
        capacity: 20,
      });

      // Create test lead inquiry
      testLead = await Lead.create({
        name: 'Rohan Sharma',
        phone: '9876543210',
        email: 'rohan.sharma@example.com',
        isInstituteInquiry: true,
        status: 'qualified',
      });

      // 1st enrollment request
      const req1 = {
        body: {
          inquiryId: testLead._id,
          name: 'Rohan Sharma',
          phone: '9876543210',
          email: 'rohan.sharma@example.com',
          courseId: testCourse._id,
          batchId: testBatch._id,
          totalFee: 35000,
          discount: 5000,
          initialPayment: 10000,
        },
        user: testUser,
      };
      const res1 = mockResponse();
      await studentCtrl.enrollStudent(req1, res1);

      assert.strictEqual(res1.statusCode, 201);
      assert.strictEqual(res1.data.success, true);
      const student = res1.data.data.student;
      assert.ok(student.studentId);
      assert.strictEqual(student.name, 'Rohan Sharma');

      // Verify Lead was updated to converted
      const updatedLead = await Lead.findById(testLead._id);
      assert.strictEqual(updatedLead.status, 'converted');
      assert.ok(updatedLead.convertedToStudent);

      // Verify Fee was created with correct totals
      const fee = await InstituteFee.findOne({ student: student._id });
      assert.ok(fee);
      assert.strictEqual(fee.totalFee, 35000);
      assert.strictEqual(fee.discount, 5000);
      assert.strictEqual(fee.finalPayable, 30000);
      assert.strictEqual(fee.paidAmount, 10000);
      assert.strictEqual(fee.dueAmount, 20000);
      assert.strictEqual(fee.status, 'partial');
      assert.strictEqual(fee.receipts.length, 1);

      // 2nd enrollment request with same inquiry (Duplicate click)
      const res2 = mockResponse();
      await studentCtrl.enrollStudent(req1, res2);

      assert.strictEqual(res2.statusCode, 400);
      assert.strictEqual(res2.data.success, false);
      assert.match(res2.data.message, /already enrolled/i);

      // Clean up created student & fee
      await Student.findByIdAndDelete(student._id);
      await InstituteFee.findByIdAndDelete(fee._id);
    });

    test('Batch capacity rejection: cannot enroll when batch capacity is reached', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const tightBatch = await Batch.create({
        name: 'Single Seat Batch',
        course: testCourse._id,
        startDate: new Date('2026-08-01'),
        endDate: new Date('2026-10-31'),
        schedule: 'Weekdays 2pm',
        capacity: 1,
      });

      // Enroll first student - should succeed
      const req1 = {
        body: {
          name: 'First Student',
          phone: '9111111111',
          courseId: testCourse._id,
          batchId: tightBatch._id,
          totalFee: 20000,
        },
        user: testUser,
      };
      const res1 = mockResponse();
      await studentCtrl.enrollStudent(req1, res1);
      assert.strictEqual(res1.statusCode, 201);
      const student1 = res1.data.data.student;

      // Attempt to enroll second student into full batch - should fail
      const req2 = {
        body: {
          name: 'Second Student',
          phone: '9222222222',
          courseId: testCourse._id,
          batchId: tightBatch._id,
          totalFee: 20000,
        },
        user: testUser,
      };
      const res2 = mockResponse();
      await studentCtrl.enrollStudent(req2, res2);
      assert.strictEqual(res2.statusCode, 400);
      assert.match(res2.data.message, /already at full capacity/i);

      // Cleanup
      await Student.findByIdAndDelete(student1._id);
      await InstituteFee.findOneAndDelete({ student: student1._id });
      await Batch.findByIdAndDelete(tightBatch._id);
    });

    test('Sales route proxy: enrollStudent via lead params sets inquiryId and enrolls student', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const lead = await Lead.create({
        name: 'Proxy Lead',
        phone: '9555555555',
        email: 'proxy.lead@example.com',
        isInstituteInquiry: true,
        status: 'qualified',
      });

      const req = {
        params: { id: lead._id },
        body: {
          name: 'Proxy Lead',
          phone: '9555555555',
          courseId: testCourse._id,
          batchId: testBatch._id,
          totalFee: 15000,
        },
        user: testUser,
      };

      // Simulating router.post('/leads/:id/enroll', ...)
      req.body.inquiryId = req.params.id;
      const res = mockResponse();
      await studentCtrl.enrollStudent(req, res);

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.data.success, true);
      const student = res.data.data.student;
      assert.strictEqual(student.name, 'Proxy Lead');

      const updatedLead = await Lead.findById(lead._id);
      assert.strictEqual(updatedLead.status, 'converted');
      assert.strictEqual(String(updatedLead.convertedToStudent), String(student._id));

      // Cleanup
      await Student.findByIdAndDelete(student._id);
      await InstituteFee.findOneAndDelete({ student: student._id });
      await Lead.findByIdAndDelete(lead._id);
    });
  });

  describe('3. Fees and Payments', () => {
    test('Payment recording rejects amount <= 0', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const req = {
        params: { id: new mongoose.Types.ObjectId() },
        body: { amount: 0 },
        user: testUser,
      };
      const res = mockResponse();
      await feeCtrl.recordPayment(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.match(res.data.message, /greater than 0/i);
    });

    test('Payment recording allocates installments via FIFO and generates receipt', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      // Setup student with 2 installments (10,000 each)
      const enrollReq = {
        body: {
          name: 'Pooja Verma',
          phone: '9333333333',
          courseId: testCourse._id,
          batchId: testBatch._id,
          totalFee: 20000,
          discount: 0,
          installments: [
            { installmentNumber: 1, amount: 10000, dueDate: new Date('2026-08-01') },
            { installmentNumber: 2, amount: 10000, dueDate: new Date('2026-09-01') },
          ],
        },
        user: testUser,
      };
      const enrollRes = mockResponse();
      await studentCtrl.enrollStudent(enrollReq, enrollRes);
      assert.strictEqual(enrollRes.statusCode, 201);
      const student = enrollRes.data.data.student;
      const initialFee = enrollRes.data.data.fee;

      assert.strictEqual(initialFee.status, 'unpaid');
      assert.strictEqual(initialFee.dueAmount, 20000);

      // Record partial payment of 15,000 (covers inst 1 + half of inst 2)
      const payReq1 = {
        params: { id: initialFee._id },
        body: {
          amount: 15000,
          paymentMethod: 'upi',
          transactionReference: 'TXN-TEST-12345',
          notes: 'Test installment payment',
        },
        user: testUser,
      };
      const payRes1 = mockResponse();
      await feeCtrl.recordPayment(payReq1, payRes1);
      assert.strictEqual(payRes1.statusCode, 201);

      const updatedFee = await InstituteFee.findById(initialFee._id);
      assert.strictEqual(updatedFee.paidAmount, 15000);
      assert.strictEqual(updatedFee.dueAmount, 5000);
      assert.strictEqual(updatedFee.status, 'partial');
      assert.strictEqual(updatedFee.installments[0].status, 'paid');
      assert.strictEqual(updatedFee.installments[0].paidAmount, 10000);
      assert.strictEqual(updatedFee.installments[1].status, 'partial');
      assert.strictEqual(updatedFee.installments[1].paidAmount, 5000);
      assert.strictEqual(updatedFee.receipts.length, 1);
      assert.ok(updatedFee.receipts[0].receiptNumber.startsWith('RCP-'));

      // Pay remaining 5,000
      const payReq2 = {
        params: { id: initialFee._id },
        body: { amount: 5000, paymentMethod: 'cash' },
        user: testUser,
      };
      const payRes2 = mockResponse();
      await feeCtrl.recordPayment(payReq2, payRes2);
      assert.strictEqual(payRes2.statusCode, 201);

      const fullyPaidFee = await InstituteFee.findById(initialFee._id);
      assert.strictEqual(fullyPaidFee.paidAmount, 20000);
      assert.strictEqual(fullyPaidFee.dueAmount, 0);
      assert.strictEqual(fullyPaidFee.status, 'paid');
      assert.strictEqual(fullyPaidFee.installments[1].status, 'paid');

      // Cleanup
      await Student.findByIdAndDelete(student._id);
      await InstituteFee.findByIdAndDelete(initialFee._id);
    });
  });

  describe('4. Attendance', () => {
    test('Attendance unique compound index on batch and date', () => {
      const indexes = StudentAttendance.schema.indexes();
      const hasBatchDateIndex = indexes.some(
        ([fields, options]) => fields.batch === 1 && fields.date === 1 && options?.unique === true
      );
      assert.ok(hasBatchDateIndex, 'StudentAttendance must have compound unique index on { batch: 1, date: 1 }');
    });

    test('saveBatchAttendance performs atomic upsert preventing duplicate sheets', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const mockStudentId = new mongoose.Types.ObjectId();
      const targetDate = '2026-08-15';

      // 1st save
      const req1 = {
        body: {
          batchId: testBatch._id,
          date: targetDate,
          records: [{ student: mockStudentId, status: 'present', remarks: 'On time' }],
        },
        user: testUser,
      };
      const res1 = mockResponse();
      await attendanceCtrl.saveBatchAttendance(req1, res1);
      assert.strictEqual(res1.statusCode, 200);

      // 2nd save on same batch and date (update to absent)
      const req2 = {
        body: {
          batchId: testBatch._id,
          date: targetDate,
          records: [{ student: mockStudentId, status: 'absent', remarks: 'Medical leave' }],
        },
        user: testUser,
      };
      const res2 = mockResponse();
      await attendanceCtrl.saveBatchAttendance(req2, res2);
      assert.strictEqual(res2.statusCode, 200);

      // Verify only 1 document exists for this batch & date
      const d = new Date(targetDate);
      const normalizedDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
      const count = await StudentAttendance.countDocuments({ batch: testBatch._id, date: normalizedDate });
      assert.strictEqual(count, 1, 'Only one attendance document should exist per batch and date');

      const savedDoc = await StudentAttendance.findOne({ batch: testBatch._id, date: normalizedDate });
      assert.strictEqual(savedDoc.records[0].status, 'absent');
      assert.strictEqual(savedDoc.records[0].remarks, 'Medical leave');

      // Cleanup
      await StudentAttendance.deleteMany({ batch: testBatch._id });
    });
  });

  describe('5. Follow-ups', () => {
    test('Follow-up scheduling updates Lead followUpDate', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const lead = await Lead.create({
        name: 'Amit Patel',
        phone: '9444444444',
        email: 'amit.patel@example.com',
        isInstituteInquiry: true,
        status: 'new',
      });

      const schedDate = '2026-09-10';
      const req = {
        body: {
          inquiryId: lead._id,
          title: 'Discuss Python syllabus with Amit',
          scheduledDate: schedDate,
          scheduledTime: '11:30',
          typeOfFollowUp: 'call',
        },
        user: testUser,
      };
      const res = mockResponse();
      await followupCtrl.scheduleFollowUp(req, res);
      assert.strictEqual(res.statusCode, 201);

      const updatedLead = await Lead.findById(lead._id);
      assert.ok(updatedLead.followUpDate);
      assert.strictEqual(new Date(updatedLead.followUpDate).toISOString().slice(0, 10), schedDate);

      // Cleanup
      await FollowUp.deleteMany({ relatedId: lead._id });
      await Lead.findByIdAndDelete(lead._id);
    });
  });

  describe('6. Reports and Analytics', () => {
    test('getOverviewReports returns structured metrics', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const req = { query: {}, user: testUser };
      const res = mockResponse();
      await reportCtrl.getOverviewReports(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.data.success);
      assert.ok(res.data.data.stageBreakdown);
      assert.ok(Array.isArray(res.data.data.courseStats));
      assert.ok(Array.isArray(res.data.data.batchStats));
      assert.ok(res.data.data.feeStats);
    });
  });
});
