require('dotenv').config();
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

// Models & Repositories
const User = require('../models/User');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const attendanceRepository = require('../repositories/attendanceRepository');
const attendanceService = require('../services/attendanceService');

describe('Attendance Verification & Check-in Fix Test Suite', () => {
  let adminUser;
  let testUser;
  let testEmployee;

  before(async () => {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (mongoUri && mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000, family: 4 });
      } catch (err) {
        console.warn('MongoDB connection failed in test runner:', err.message);
      }
    }

    if (mongoose.connection.readyState === 1) {
      const timestamp = Date.now();

      adminUser = await User.create({
        name: 'Attendance Admin',
        email: `att_admin_${timestamp}@example.com`,
        password: 'password123',
        role: 'admin',
        isActive: true,
      });

      testUser = await User.create({
        name: 'Attendance Tester',
        email: `att_tester_${timestamp}@example.com`,
        password: 'password123',
        role: 'employee',
        isActive: true,
      });

      testEmployee = await Employee.create({
        user: testUser._id,
        employeeId: `EMP-ATT-${timestamp}`,
        department: 'IT',
        designation: 'Software Engineer',
        status: 'active',
      });
    }
  });

  after(async () => {
    if (mongoose.connection.readyState === 1) {
      if (testEmployee) {
        await Attendance.deleteMany({ employee: testEmployee._id });
        await Employee.findByIdAndDelete(testEmployee._id);
      }
      if (adminUser) await User.findByIdAndDelete(adminUser._id);
      if (testUser) await User.findByIdAndDelete(testUser._id);
    }
  });

  test('1. findTodayAttendance returns null when employee only has yesterday attendance (<24h ago)', async (t) => {
    if (mongoose.connection.readyState !== 1) return t.skip('DB offline');

    const now = new Date();
    // Simulate yesterday shift (16 hours ago)
    const yesterdayDate = new Date(now.getTime() - 24 * 3600000);
    yesterdayDate.setHours(0, 0, 0, 0);
    const yesterdayCheckIn = new Date(now.getTime() - 16 * 3600000);
    const yesterdayCheckOut = new Date(now.getTime() - 8 * 3600000);

    const pastAttendance = await Attendance.create({
      employee: testEmployee._id,
      date: yesterdayDate,
      checkIn: yesterdayCheckIn,
      checkOut: yesterdayCheckOut,
      hoursWorked: 8,
      status: 'present',
    });

    const todayRec = await attendanceRepository.findTodayAttendance(testEmployee._id.toString());
    assert.strictEqual(todayRec, null, 'findTodayAttendance must return null if employee has not checked in today');

    await Attendance.findByIdAndDelete(pastAttendance._id);
  });

  test('2. Employee who worked yesterday can successfully check in today without "Already checked in" error', async (t) => {
    if (mongoose.connection.readyState !== 1) return t.skip('DB offline');

    const now = new Date();
    // Create yesterday completed attendance
    const yesterdayDate = new Date(now.getTime() - 24 * 3600000);
    yesterdayDate.setHours(0, 0, 0, 0);
    const yesterdayCheckIn = new Date(now.getTime() - 18 * 3600000);
    const yesterdayCheckOut = new Date(now.getTime() - 10 * 3600000);

    const pastAttendance = await Attendance.create({
      employee: testEmployee._id,
      date: yesterdayDate,
      checkIn: yesterdayCheckIn,
      checkOut: yesterdayCheckOut,
      hoursWorked: 8,
      status: 'present',
    });

    // Attempt today check-in
    const result = await attendanceService.checkIn(testEmployee._id.toString(), {}, adminUser);
    assert.strictEqual(result.success, true, 'Check-in must succeed today');
    assert.ok(result.data._id, 'Must return created attendance record');
    assert.ok(result.data.checkIn, 'Must record checkIn timestamp');

    // Clean up
    await Attendance.deleteMany({ employee: testEmployee._id });
  });

  test('3. Prevents duplicate check-in if employee ALREADY checked in on the SAME day', async (t) => {
    if (mongoose.connection.readyState !== 1) return t.skip('DB offline');

    // 1st Check-in today
    const firstCheckIn = await attendanceService.checkIn(testEmployee._id.toString(), {}, adminUser);
    assert.strictEqual(firstCheckIn.success, true);

    // 2nd Check-in attempt today -> Must throw "Already checked in today"
    let threwError = false;
    try {
      await attendanceService.checkIn(testEmployee._id.toString(), {}, adminUser);
    } catch (err) {
      threwError = true;
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.message, 'Already checked in today');
    }
    assert.strictEqual(threwError, true, 'Duplicate check-in on the same day must be rejected');

    // Clean up
    await Attendance.deleteMany({ employee: testEmployee._id });
  });

  test('4. Auto-closes forgotten unclosed shift from yesterday when employee checks in today', async (t) => {
    if (mongoose.connection.readyState !== 1) return t.skip('DB offline');

    const now = new Date();
    // Yesterday shift that was never checked out
    const yesterdayDate = new Date(now.getTime() - 24 * 3600000);
    yesterdayDate.setHours(0, 0, 0, 0);
    const yesterdayCheckIn = new Date(now.getTime() - 20 * 3600000);

    const unclosedShift = await Attendance.create({
      employee: testEmployee._id,
      date: yesterdayDate,
      checkIn: yesterdayCheckIn,
      checkOut: null,
      status: 'present',
    });

    // Today employee checks in
    const result = await attendanceService.checkIn(testEmployee._id.toString(), {}, adminUser);
    assert.strictEqual(result.success, true, 'Today check-in must succeed');

    // Verify yesterday unclosed session was auto-closed
    const refreshedUnclosed = await Attendance.findById(unclosedShift._id);
    assert.ok(refreshedUnclosed.checkOut, 'Yesterday unclosed session must have checkOut set');
    assert.strictEqual(refreshedUnclosed.checkOutMethod, 'auto_system');
    assert.ok(refreshedUnclosed.notes.includes('Auto-closed'), 'Note must explain auto-checkout');

    // Clean up
    await Attendance.deleteMany({ employee: testEmployee._id });
  });

  test('5. Check-out updates today attendance record with checkOut timestamp and hours worked', async (t) => {
    if (mongoose.connection.readyState !== 1) return t.skip('DB offline');

    // Check-in
    await attendanceService.checkIn(testEmployee._id.toString(), {}, adminUser);

    // Check-out
    const checkOutRes = await attendanceService.checkOut(testEmployee._id.toString(), { notes: 'Day complete' }, adminUser);
    assert.strictEqual(checkOutRes.success, true);
    assert.ok(checkOutRes.data.checkOut, 'Must have checkOut timestamp');

    // Attempt second check-out -> Must throw "Already checked out today"
    let threwDoubleCheckout = false;
    try {
      await attendanceService.checkOut(testEmployee._id.toString(), {}, adminUser);
    } catch (err) {
      threwDoubleCheckout = true;
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.message, 'Already checked out today');
    }
    assert.strictEqual(threwDoubleCheckout, true);

    // Clean up
    await Attendance.deleteMany({ employee: testEmployee._id });
  });
});

