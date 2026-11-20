/**
 * AI Sales Copilot & Algorithmic Lead Scoring Engine for Radhix CRM
 */

export const calculateLeadScore = (lead = {}) => {
  let score = 20; // Base baseline score
  const positiveSignals = [];
  const improvementSignals = [];

  // 1. Contact info completeness
  if (lead.phone && lead.email) {
    score += 25;
    positiveSignals.push('Verified multi-channel contact (Phone & Email)');
  } else if (lead.phone || lead.email) {
    score += 15;
    improvementSignals.push('Missing secondary contact channel');
  }

  // 2. Budget / Deal Value
  const val = Number(lead.value || 0);
  if (val >= 100000) {
    score += 25;
    positiveSignals.push(`High ticket inquiry value (₹${val.toLocaleString('en-IN')})`);
  } else if (val > 0) {
    score += 15;
    positiveSignals.push(`Qualified budget (₹${val.toLocaleString('en-IN')})`);
  } else {
    improvementSignals.push('Budget not yet identified');
  }

  // 3. Stage & Status Advancement
  const status = String(lead.status || '').toLowerCase();
  if (['qualified', 'proposal', 'negotiation', 'won', 'converted'].includes(status)) {
    score += 25;
    positiveSignals.push(`Advanced pipeline status (${lead.status})`);
  } else if (['contacted'].includes(status)) {
    score += 10;
  }

  // 4. Requirements provided
  if (lead.notes || lead.requirements) {
    score += 10;
    positiveSignals.push('Explicit requirements / notes documented');
  }

  // Cap between 5 and 99
  const finalScore = Math.min(99, Math.max(10, score));

  let tier = 'cold';
  let label = 'Cold Lead';
  let color = '#3b82f6';
  let emoji = '❄️';

  if (finalScore >= 75) {
    tier = 'hot';
    label = 'Hot Lead (High Intent)';
    color = '#ef4444';
    emoji = '🔥';
  } else if (finalScore >= 45) {
    tier = 'warm';
    label = 'Warm Lead (Nurturing)';
    color = '#f59e0b';
    emoji = '⚡';
  }

  let aiAdvice = '';
  if (tier === 'hot') {
    aiAdvice = 'High closing probability. Fast follow-up via WhatsApp or call within 2 hours recommended.';
  } else if (tier === 'warm') {
    aiAdvice = 'Good engagement potential. Share a tailored brochure or quotation to build confidence.';
  } else {
    aiAdvice = 'Early stage. Qualify specific requirements, preferred budget and timeline before sending proposal.';
  }

  return {
    score: finalScore,
    tier,
    label,
    color,
    emoji,
    aiAdvice,
    positiveSignals,
    improvementSignals,
  };
};

export const generateAiFollowUpPitches = (lead = {}) => {
  const name = lead.name || 'Client';
  const industry = lead.industry || 'General';
  const val = lead.value ? `₹${Number(lead.value).toLocaleString('en-IN')}` : 'our premium package';

  return [
    {
      id: 'quick_touch',
      title: 'Polite Relationship Touchpoint',
      badge: 'Soft Follow-up',
      text: `Hi ${name}, hope you are having a productive week! I wanted to check if you had a chance to review the details we discussed for your ${industry} requirements. Happy to answer any questions you might have.`,
    },
    {
      id: 'value_urgency',
      title: 'Value & Decision Acceleration',
      badge: 'High Conversion',
      text: `Hello ${name}, following up regarding your inquiry for ${val}. We have an exclusive pricing slot available this week for early approvals. Would you have 5 minutes today for a quick call?`,
    },
    {
      id: 'meeting_schedule',
      title: 'Direct Demo / Site Visit Invitation',
      badge: 'Action-Oriented',
      text: `Hi ${name}, I would love to walk you through a quick 10-minute demo tailored to your business needs. Would tomorrow 11:30 AM or 4:00 PM work better for you?`,
    },
  ];
};

