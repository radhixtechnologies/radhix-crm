require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Employee = require('../models/Employee');
const LeaveBalance = require('../models/LeaveBalance');

async function ensureEmployeeProfiles() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zynextro-crm', {
    serverSelectionTimeoutMS: 10000,
  });

  const users = await User.find({}).lean();
  let created = 0;
  let existing = 0;

  for (const user of users) {
    let employee = await Employee.findOne({ user: user._id, deletedAt: null }).lean();
    if (!employee) {
      const dept = user.department || 'Management';
      const codeMap = {
        IT: 'DEV',
        HR: 'HR',
        Sales: 'MKT',
        Finance: 'FIN',
        Management: 'MGMT',
        Operations: 'OPS',
      };
      const counterDoc = await mongoose.connection.collection('counters').findOneAndUpdate(
        { _id: 'employeeId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      const seq = String(counterDoc && counterDoc.value ? counterDoc.value.seq : 1).padStart(4, '0');
      const year = new Date().getFullYear().toString().slice(-2);
      const deptCode = codeMap[dept] || 'GEN';
      const employeeId = `ZY${year}/ND/${deptCode}/${seq}`;

      const newEmployee = await Employee.create({
        user: user._id,
        employeeId,
        department: dept,
        designation: user.role === 'super_admin' ? 'Super Administrator' : user.role === 'admin' ? 'Administrator' : 'Employee',
        status: 'active',
        joiningDate: new Date(),
        employmentType: 'full-time',
        workLocation: 'office',
      });

      await LeaveBalance.findOneAndUpdate(
        { employee: newEmployee._id, year: new Date().getFullYear() },
        {
          $setOnInsert: {
            employee: newEmployee._id,
            year: new Date().getFullYear(),
            balances: {
              casual: { total: 12, available: 12, used: 0 },
              sick: { total: 10, available: 10, used: 0 },
              annual: { total: 15, available: 15, used: 0 },
            },
          },
        },
        { upsert: true, new: true }
      );

      created += 1;
      console.log(`Created ${user.email} -> ${employeeId}`);
    } else {
      existing += 1;
    }
  }

  console.log(`Done. Created: ${created}, Existing: ${existing}`);
  process.exit(0);
}

ensureEmployeeProfiles().catch((err) => {
  console.error(err);
  process.exit(1);
});
