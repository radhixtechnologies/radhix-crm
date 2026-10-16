require('dotenv').config();
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

// Models
const DailyUpdate = require('../models/DailyUpdate');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Project = require('../models/Project');

// Controller
const dailyUpdateCtrl = require('../controllers/dailyUpdateController');

// Helper to mock res
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

describe('Daily Work Update (DSR / Daily Standup) Module Test Suite', () => {
  let adminUser;
  let employeeUser1;
  let employeeUser2;
  let employee1;
  let employee2;
  let testProject;

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
      const timestamp = Date.now();

      // 1. Admin User
      adminUser = await User.create({
        name: 'Daily Admin',
        email: `daily_admin_${timestamp}@example.com`,
        password: 'password123',
        role: 'admin',
        isActive: true,
      });

      // 2. Employee 1 (Developer)
      employeeUser1 = await User.create({
        name: 'Jordan Dev',
        email: `jordan_dev_${timestamp}@example.com`,
        password: 'password123',
        role: 'employee',
        isActive: true,
      });
      employee1 = await Employee.create({
        user: employeeUser1._id,
        employeeId: `EMP-DSR-${timestamp}-1`,
        department: 'IT',
        designation: 'Backend Developer',
        status: 'active',
      });

      // 3. Employee 2 (QA)
      employeeUser2 = await User.create({
        name: 'Taylor QA',
        email: `taylor_qa_${timestamp}@example.com`,
        password: 'password123',
        role: 'employee',
        isActive: true,
      });
      employee2 = await Employee.create({
        user: employeeUser2._id,
        employeeId: `EMP-DSR-${timestamp}-2`,
        department: 'IT',
        designation: 'QA Engineer',
        status: 'active',
      });

      // 4. Project for reference
      testProject = await Project.create({
        name: `DSR Alpha Project ${timestamp}`,
        code: `PRJ-DSR-${timestamp}`,
        description: 'Test project for daily updates',
        createdBy: adminUser._id,
        status: 'active',
      });
    }
  });

  after(async () => {
    if (mongoose.connection.readyState === 1) {
      // Clean up test records
      if (employee1) {
        await DailyUpdate.deleteMany({ employee: employee1._id });
        await Employee.findByIdAndDelete(employee1._id);
      }
      if (employee2) {
        await DailyUpdate.deleteMany({ employee: employee2._id });
        await Employee.findByIdAndDelete(employee2._id);
      }
      if (testProject) {
        await Project.findByIdAndDelete(testProject._id);
      }
      if (adminUser) await User.findByIdAndDelete(adminUser._id);
      if (employeeUser1) await User.findByIdAndDelete(employeeUser1._id);
      if (employeeUser2) await User.findByIdAndDelete(employeeUser2._id);

      await mongoose.disconnect();
    }
  });

  describe('1. Model Validations', () => {
    test('DailyUpdate model validation: requires employee, user, date, tasksDone', () => {
      const invalidUpdate = new DailyUpdate({});
      const err = invalidUpdate.validateSync();
      assert.ok(err, 'Validation should fail for empty update');
      assert.ok(err.errors.employee, 'employee is required');
      assert.ok(err.errors.user, 'user is required');
      assert.ok(err.errors.date, 'date is required');
      assert.ok(err.errors.tasksDone, 'tasksDone is required');
    });

    test('DailyUpdate model validation: hoursWorked cannot exceed 24 or be negative', () => {
      const updateOverMax = new DailyUpdate({
        employee: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        date: new Date(),
        tasksDone: 'Built feature',
        hoursWorked: 25,
      });
      const errMax = updateOverMax.validateSync();
      assert.ok(errMax, 'Validation should fail when hours > 24');
      assert.ok(errMax.errors.hoursWorked, 'hoursWorked validator failed');

      const updateNegative = new DailyUpdate({
        employee: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        date: new Date(),
        tasksDone: 'Built feature',
        hoursWorked: -2,
      });
      const errNeg = updateNegative.validateSync();
      assert.ok(errNeg, 'Validation should fail when hours < 0');
      assert.ok(errNeg.errors.hoursWorked, 'hoursWorked negative check failed');
    });

    test('DailyUpdate model validation: default status is "submitted" and hasBlockers defaults to false', () => {
      const update = new DailyUpdate({
        employee: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        date: new Date(),
        tasksDone: 'Finished user API routes',
      });
      assert.strictEqual(update.status, 'submitted');
      assert.strictEqual(update.hasBlockers, false);
      assert.strictEqual(update.hoursWorked, 8);
    });
  });

  describe('2. Controller & Business Logic (Live DB)', () => {
    let createdUpdateId;

    test('saveDailyUpdate: Employee submits daily update with tasks, plan, blockers, hours', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database not connected');

      const req = {
        user: employeeUser1,
        body: {
          tasksDone: 'Completed authentication & daily updates backend module',
          planForTomorrow: 'Add unit tests and verify UI flows',
          blockers: 'Waiting for staging server credentials',
          hoursWorked: 7.5,
          project: testProject._id.toString(),
        },
      };
      const res = mockResponse();

      await dailyUpdateCtrl.saveDailyUpdate(req, res);

      assert.strictEqual(res.statusCode, 201);
      assert.ok(res.data.success);
      assert.ok(res.data.data._id);
      assert.strictEqual(res.data.data.hasBlockers, true);
      assert.strictEqual(res.data.data.hoursWorked, 7.5);
      assert.strictEqual(res.data.data.status, 'submitted');

      createdUpdateId = res.data.data._id;
    });

    test('saveDailyUpdate: Upserts cleanly without duplicate record when submitted again for same date', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database not connected');

      const req = {
        user: employeeUser1,
        body: {
          tasksDone: 'Completed authentication & daily updates backend module (Updated with more notes)',
          planForTomorrow: 'Wrap up UI verification',
          blockers: '', // Removed blockers
          hoursWorked: 8,
          project: testProject._id.toString(),
        },
      };
      const res = mockResponse();

      await dailyUpdateCtrl.saveDailyUpdate(req, res);

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(String(res.data.data._id), String(createdUpdateId));
      assert.strictEqual(res.data.data.hasBlockers, false);
      assert.strictEqual(res.data.data.hoursWorked, 8);

      // Verify DB count for this employee and date is still exactly 1
      const count = await DailyUpdate.countDocuments({ employee: employee1._id });
      assert.strictEqual(count, 1);
    });

    test('saveDailyUpdate: Rejects submission without tasksDone', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database not connected');

      const req = {
        user: employeeUser1,
        body: {
          tasksDone: '   ',
        },
      };
      const res = mockResponse();

      await dailyUpdateCtrl.saveDailyUpdate(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.data.success, false);
    });

    test('getTodayUpdate: Returns current employee update for today', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database not connected');

      const req = { user: employeeUser1 };
      const res = mockResponse();

      await dailyUpdateCtrl.getTodayUpdate(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.hasSubmitted, true);
      assert.ok(res.data.data);
      assert.strictEqual(String(res.data.data._id), String(createdUpdateId));
    });

    test('getTodayUpdate: Returns hasSubmitted: false for employee who has not submitted today', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database not connected');

      const req = { user: employeeUser2 };
      const res = mockResponse();

      await dailyUpdateCtrl.getTodayUpdate(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.hasSubmitted, false);
      assert.strictEqual(res.data.data, null);
    });

    test('getDailyUpdates: Non-admin employee only sees their own updates', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database not connected');

      const req = {
        user: employeeUser1,
        query: {},
      };
      const res = mockResponse();

      await dailyUpdateCtrl.getDailyUpdates(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.data.success);
      assert.ok(Array.isArray(res.data.data));
      // All returned updates must belong to employee1
      res.data.data.forEach((u) => {
        assert.strictEqual(String(u.employee?._id || u.employee), String(employee1._id));
      });
    });

    test('getDailyUpdates: Admin sees all employees updates and can filter', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database not connected');

      const req = {
        user: adminUser,
        query: { department: 'IT' },
      };
      const res = mockResponse();

      await dailyUpdateCtrl.getDailyUpdates(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.data.success);
      assert.ok(res.data.total >= 1);
    });

    test('getSubmissionTracker: Calculates submitted vs pending counts and lists pending employees', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database not connected');

      const req = {
        user: adminUser,
        query: {},
      };
      const res = mockResponse();

      await dailyUpdateCtrl.getSubmissionTracker(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.data.success);
      const tracker = res.data.data;
      assert.ok(tracker.totalActiveEmployees >= 2);
      assert.ok(tracker.submittedCount >= 1);
      // employee2 should be in pending list
      const pendingEmp2 = tracker.pending.find((p) => String(p.employee._id) === String(employee2._id));
      assert.ok(pendingEmp2, 'Employee 2 who has not submitted should be in pending list');
    });

    test('submitFeedback: Manager/Admin leaves feedback and status becomes reviewed', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database not connected');

      const req = {
        user: adminUser,
        params: { id: createdUpdateId.toString() },
        body: { comment: 'Great progress on authentication! Please keep up the momentum.' },
      };
      const res = mockResponse();

      await dailyUpdateCtrl.submitFeedback(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.data.success);
      assert.strictEqual(res.data.data.status, 'reviewed');
      assert.strictEqual(res.data.data.managerFeedback.comment, 'Great progress on authentication! Please keep up the momentum.');
    });

    test('submitFeedback: Rejects regular employee trying to provide manager feedback with 403', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database not connected');

      const req = {
        user: employeeUser2,
        params: { id: createdUpdateId.toString() },
        body: { comment: 'Unauthorized review' },
      };
      const res = mockResponse();

      await dailyUpdateCtrl.submitFeedback(req, res);

      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.data.success, false);
    });

    test('deleteDailyUpdate: Rejects unauthorized user deleting another employee update', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database not connected');

      const req = {
        user: employeeUser2,
        params: { id: createdUpdateId.toString() },
      };
      const res = mockResponse();

      await dailyUpdateCtrl.deleteDailyUpdate(req, res);

      assert.strictEqual(res.statusCode, 403);
    });

    test('deleteDailyUpdate: Allows owner employee to delete their update', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database not connected');

      const req = {
        user: employeeUser1,
        params: { id: createdUpdateId.toString() },
      };
      const res = mockResponse();

      await dailyUpdateCtrl.deleteDailyUpdate(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.success, true);

      // Verify deleted from DB
      const found = await DailyUpdate.findById(createdUpdateId);
      assert.strictEqual(found, null);
    });
  });
});
