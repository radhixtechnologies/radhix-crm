const cron = require('node-cron');
const LeaveBalance = require('../models/LeaveBalance');
const Employee = require('../models/Employee');

/**
 * Leave Accrual Job
 * Runs monthly to accrue leaves for employees
 * Schedule: First day of every month at 1 AM
 */
const leaveAccrualJob = cron.schedule('0 1 1 * *', async () => {
  console.log('Starting leave accrual job...');
  
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get all active employees
    const employees = await Employee.find({
      status: 'active',
      deletedAt: null,
    }).select('_id');

    let processed = 0;
    let errors = 0;

    for (const employee of employees) {
      try {
        // Get or create leave balance for current year
        let leaveBalance = await LeaveBalance.findOne({
          employee: employee._id,
          year: currentYear,
        });

        if (!leaveBalance) {
          // Create new leave balance
          leaveBalance = await LeaveBalance.create({
            employee: employee._id,
            year: currentYear,
          });
        }

        // Accrue monthly leaves (if applicable)
        // Casual: 1 day per month (12 days/year)
        // Annual: 1.25 days per month (15 days/year)
        // Sick: Accrues as needed, typically reset annually

        // Update balances if needed (this depends on your policy)
        // Example: Monthly accrual for annual leaves
        const monthsWorked = currentMonth; // Assuming calendar year
        const annualAccrual = Math.floor((15 * monthsWorked) / 12);
        
        if (leaveBalance.balances.annual.total < annualAccrual) {
          leaveBalance.balances.annual.total = annualAccrual;
          leaveBalance.balances.annual.available = 
            annualAccrual - leaveBalance.balances.annual.used - leaveBalance.balances.annual.pending;
          await leaveBalance.save();
        }

        processed++;
      } catch (error) {
        console.error(`Error processing employee ${employee._id}:`, error);
        errors++;
      }
    }

    console.log(`Leave accrual job completed. Processed: ${processed}, Errors: ${errors}`);
  } catch (error) {
    console.error('Leave accrual job error:', error);
  }
}, {
  scheduled: false, // Don't start automatically
  timezone: 'Asia/Kolkata',
});

/**
 * Reset leave balances for new year
 * Schedule: January 1st at 2 AM
 */
const resetLeaveBalancesJob = cron.schedule('0 2 1 1 *', async () => {
  console.log('Starting leave balance reset job...');
  
  try {
    const newYear = new Date().getFullYear();
    const employees = await Employee.find({
      status: 'active',
      deletedAt: null,
    }).select('_id');

    for (const employee of employees) {
      try {
        // Create new leave balance for the year
        await LeaveBalance.create({
          employee: employee._id,
          year: newYear,
        });

        // Optional: Carry forward unused casual/annual leaves (as per policy)
        // This would require fetching previous year's balance and updating
        
      } catch (error) {
        console.error(`Error resetting balance for employee ${employee._id}:`, error);
      }
    }

    console.log('Leave balance reset job completed');
  } catch (error) {
    console.error('Leave balance reset job error:', error);
  }
}, {
  scheduled: false,
  timezone: 'Asia/Kolkata',
});

module.exports = {
  leaveAccrualJob,
  resetLeaveBalancesJob,
};

