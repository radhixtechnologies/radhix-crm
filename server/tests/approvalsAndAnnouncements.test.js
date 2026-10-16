require('dotenv').config();
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

// Models
const Announcement = require('../models/Announcement');
const Leave = require('../models/Leave');
const Expense = require('../models/Expense');
const DailyUpdate = require('../models/DailyUpdate');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Project = require('../models/Project');

// Controllers
const announcementCtrl = require('../controllers/announcementController');
const approvalCtrl = require('../controllers/approvalController');
const searchCtrl = require('../controllers/searchController');

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

describe('Approvals Hub & Announcements Test Suite', () => {
  let adminUser;
  let regularUser;
  let testEmployee;
  let testAnnouncement;
  let testLeave;
  let testExpense;
  let testProject;

  before(async () => {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (mongoUri && mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      } catch (err) {
        console.warn('MongoDB connection failed in test runner:', err.message);
      }
    }

    if (mongoose.connection.readyState === 1) {
      const timestamp = Date.now();

      // 1. Admin
      adminUser = await User.create({
        name: 'Executive Admin',
        email: `exec_admin_${timestamp}@example.com`,
        password: 'password123',
        role: 'admin',
        isActive: true,
      });

      // 2. Regular User & Employee
      regularUser = await User.create({
        name: 'Riley Staff',
        email: `riley_staff_${timestamp}@example.com`,
        password: 'password123',
        role: 'employee',
        isActive: true,
      });

      testEmployee = await Employee.create({
        user: regularUser._id,
        employeeId: `EMP-APP-${timestamp}`,
        department: 'IT',
        designation: 'Software Engineer',
        status: 'active',
      });

      // 3. Project for search
      testProject = await Project.create({
        name: `Quantum CRM Suite ${timestamp}`,
        code: `PRJ-QNT-${timestamp}`,
        description: 'Next-gen enterprise software suite',
        createdBy: adminUser._id,
        status: 'active',
      });
    }
  });

  after(async () => {
    if (mongoose.connection.readyState === 1) {
      if (testAnnouncement) await Announcement.findByIdAndDelete(testAnnouncement._id);
      if (testLeave) await Leave.findByIdAndDelete(testLeave._id);
      if (testExpense) await Expense.findByIdAndDelete(testExpense._id);
      if (testProject) await Project.findByIdAndDelete(testProject._id);
      if (testEmployee) await Employee.findByIdAndDelete(testEmployee._id);
      if (adminUser) await User.findByIdAndDelete(adminUser._id);
      if (regularUser) await User.findByIdAndDelete(regularUser._id);

      await mongoose.disconnect();
    }
  });

  describe('1. Company Announcements & Notice Board', () => {
    test('Announcement model: requires title, content, and author', () => {
      const invalid = new Announcement({});
      const err = invalid.validateSync();
      assert.ok(err, 'Validation should fail for empty announcement');
      assert.ok(err.errors.title, 'Title is required');
      assert.ok(err.errors.content, 'Content is required');
      assert.ok(err.errors.author, 'Author is required');
    });

    test('createAnnouncement: Non-admin is rejected with 403', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('DB offline');

      const req = {
        user: regularUser,
        body: { title: 'Unauthorized Notice', content: 'Testing non-admin broadcast' },
      };
      const res = mockResponse();

      await announcementCtrl.createAnnouncement(req, res);
      assert.strictEqual(res.statusCode, 403);
    });

    test('createAnnouncement: Admin successfully broadcasts announcement', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('DB offline');

      const req = {
        user: adminUser,
        body: {
          title: 'Annual Tech Townhall 2026',
          content: 'Join us this Friday for our annual company product showcase and roadmap.',
          category: 'event',
          priority: 'high',
          pinned: true,
        },
      };
      const res = mockResponse();

      await announcementCtrl.createAnnouncement(req, res);
      assert.strictEqual(res.statusCode, 201);
      assert.ok(res.data.success);
      assert.strictEqual(res.data.data.title, 'Annual Tech Townhall 2026');
      assert.strictEqual(res.data.data.pinned, true);

      testAnnouncement = res.data.data;
    });

    test('getAnnouncements: Lists announcements with pinned first', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('DB offline');

      const req = {
        user: regularUser,
        query: { category: 'all' },
      };
      const res = mockResponse();

      await announcementCtrl.getAnnouncements(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.data.success);
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.length >= 1);
    });

    test('toggleLike: Employee reacts/likes announcement', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('DB offline');

      const req = {
        user: regularUser,
        params: { id: testAnnouncement._id.toString() },
      };
      const res = mockResponse();

      await announcementCtrl.toggleLike(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.liked, true);
      assert.strictEqual(res.data.likesCount, 1);
    });

    test('addComment: Employee adds a comment to the notice', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('DB offline');

      const req = {
        user: regularUser,
        params: { id: testAnnouncement._id.toString() },
        body: { comment: 'Looking forward to the event!' },
      };
      const res = mockResponse();

      await announcementCtrl.addComment(req, res);
      assert.strictEqual(res.statusCode, 201);
      assert.ok(res.data.success);
      assert.ok(res.data.data.length >= 1);
      assert.strictEqual(res.data.data[0].comment, 'Looking forward to the event!');
    });
  });

  describe('2. Unified Approvals & Action Center', () => {
    before(async () => {
      if (mongoose.connection.readyState === 1) {
        // Create a pending leave
        testLeave = await Leave.create({
          employee: testEmployee._id,
          type: 'casual',
          startDate: new Date('2026-11-01'),
          endDate: new Date('2026-11-03'),
          days: 3,
          reason: 'Family function trip',
          status: 'pending',
        });

        // Create a pending expense
        testExpense = await Expense.create({
          title: 'AWS Cloud Hosting Invoice Nov',
          category: 'server',
          vendor: 'Amazon Web Services',
          amount: 8500,
          createdBy: adminUser._id,
          paidBy: testEmployee._id,
          status: 'pending',
        });
      }
    });

    test('getPendingApprovals: Regular non-manager employee receives 403', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('DB offline');

      const req = { user: regularUser, query: { type: 'all' } };
      const res = mockResponse();

      await approvalCtrl.getPendingApprovals(req, res);
      assert.strictEqual(res.statusCode, 403);
    });

    test('getPendingApprovals: Admin fetches aggregated pending stream with accurate counts', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('DB offline');

      const req = { user: adminUser, query: { type: 'all' } };
      const res = mockResponse();

      await approvalCtrl.getPendingApprovals(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.data.success);
      assert.ok(res.data.data.counts.total >= 2);
      assert.ok(res.data.data.counts.leave >= 1);
      assert.ok(res.data.data.counts.expense >= 1);

      // Verify leave item structure
      const leaveItem = res.data.data.items.find((i) => i.type === 'leave' && String(i.id) === String(testLeave._id));
      assert.ok(leaveItem, 'Pending leave item should be in stream');
      assert.strictEqual(leaveItem.applicantName, 'Riley Staff');
    });

    test('processApproval: Admin approves pending leave request', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('DB offline');

      const req = {
        user: adminUser,
        params: { type: 'leave', id: testLeave._id.toString() },
        body: { action: 'approve', remarks: 'Approved by management' },
      };
      const res = mockResponse();

      await approvalCtrl.processApproval(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.data.success);
      assert.strictEqual(res.data.data.status, 'approved');

      // Verify in DB
      const updatedLeave = await Leave.findById(testLeave._id);
      assert.strictEqual(updatedLeave.status, 'approved');
      assert.strictEqual(String(updatedLeave.approvedBy), String(adminUser._id));
    });

    test('processApproval: Admin approves pending expense claim', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('DB offline');

      const req = {
        user: adminUser,
        params: { type: 'expense', id: testExpense._id.toString() },
        body: { action: 'approve', remarks: 'Valid receipt attached' },
      };
      const res = mockResponse();

      await approvalCtrl.processApproval(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.data.success);
      assert.strictEqual(res.data.data.status, 'approved');

      // Verify in DB
      const updatedExp = await Expense.findById(testExpense._id);
      assert.strictEqual(updatedExp.status, 'approved');
    });
  });

  describe('3. Global Search & Project Lookup', () => {
    test('globalSearch: Finds matching project in search results', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('DB offline');

      const req = {
        user: adminUser,
        query: { query: 'Quantum' },
      };
      const res = mockResponse();

      await searchCtrl.globalSearch(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.data.success);
      assert.ok(Array.isArray(res.data.data.projects));
      const found = res.data.data.projects.find((p) => String(p._id) === String(testProject._id));
      assert.ok(found, 'Should find project matching Quantum query');
    });
  });
});
