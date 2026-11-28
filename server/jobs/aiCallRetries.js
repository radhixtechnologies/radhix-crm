const AiCallLog = require('../models/AiCallLog');
const Lead = require('../models/Lead');
const { getEffectiveAiConfig, initiateAiCallForLead } = require('../services/aiCallingService');

const getIstHour = (date = new Date()) => {
  const ist = new Date(date.getTime() + 5.5 * 3600000);
  return ist.getUTCHours();
};

const isWithinDndHours = (hour, dndStart = 21, dndEnd = 9) => {
  if (dndStart === dndEnd) return false;
  if (dndStart > dndEnd) {
    return hour >= dndStart || hour < dndEnd;
  }
  return hour >= dndStart && hour < dndEnd;
};

const runAiCallRetries = async () => {
  const now = new Date();
  const dueCalls = await AiCallLog.find({
    retryScheduled: true,
    retryExecuted: false,
    nextRetryAt: { $lte: now },
  })
    .sort({ nextRetryAt: 1 })
    .limit(20)
    .lean();

  if (!dueCalls.length) return { checked: 0, retried: 0 };

  const currentIstHour = getIstHour(now);
  let retried = 0;

  for (const call of dueCalls) {
    try {
      const cfg = await getEffectiveAiConfig({ companyId: call.tenantCompany });
      if (!cfg?.enabled && call.provider !== 'simulator') continue;
      if (isWithinDndHours(currentIstHour, cfg.dndStartHour, cfg.dndEndHour)) {
        continue;
      }

      const claimed = await AiCallLog.findOneAndUpdate(
        { _id: call._id, retryExecuted: false },
        { retryExecuted: true },
        { new: true }
      );
      if (!claimed) continue;

      const lead = await Lead.findOne({ _id: call.lead, isDeleted: { $ne: true } });
      if (!lead || ['converted', 'lost'].includes(lead.status) || !lead.phone) continue;

      await initiateAiCallForLead({
        lead,
        companyId: call.tenantCompany,
        overrideProvider: call.provider === 'simulator' ? 'simulator' : '',
        attemptNumber: (call.attemptNumber || 1) + 1,
        parentCallId: call.parentCallId || call._id,
      });
      retried += 1;
    } catch (err) {
      console.warn(`[AI Call Retry Job] Failed retry for call ${call._id}:`, err.message);
    }
  }

  return { checked: dueCalls.length, retried };
};

module.exports = runAiCallRetries;
module.exports.isWithinDndHours = isWithinDndHours;
module.exports.getIstHour = getIstHour;
