/**
 * WhatsApp Helper Utilities & Templates for Radhix CRM
 */

export const formatWhatsAppPhone = (phone) => {
  if (!phone) return '';
  // Remove all non-digit characters
  let cleaned = String(phone).replace(/\D/g, '');

  // If 10 digits (standard Indian mobile number), prepend 91
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  // If already starts with 0 and 11 digits, replace 0 with 91
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = `91${cleaned.slice(1)}`;
  }

  return cleaned;
};

export const getWhatsAppUrl = (phone, text = '') => {
  const cleanPhone = formatWhatsAppPhone(phone);
  if (!cleanPhone) return '';
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
};

export const openWhatsApp = (phone, text = '') => {
  const url = getWhatsAppUrl(phone, text);
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

export const WHATSAPP_TEMPLATES = [
  {
    id: 'general_followup',
    name: 'Quick Sales Follow-up',
    category: 'Sales',
    template: 'Hello {name}, this is {senderName} from {company}. I am following up regarding your recent inquiry. Are you available for a brief discussion today?',
  },
  {
    id: 'proposal_sent',
    name: 'Proposal / Quotation Shared',
    category: 'Sales',
    template: 'Hello {name}, I have shared the formal proposal details with you from {company}. Please take a look at your convenience and let me know if you have any questions!',
  },
  {
    id: 'meeting_reminder',
    name: 'Upcoming Meeting / Call Reminder',
    category: 'Sales',
    template: 'Hi {name}, friendly reminder that our scheduled call is set for today at {time}. Looking forward to connecting with you.',
  },
  {
    id: 'callback_confirmation',
    name: 'Callback / Follow-up Confirmation',
    category: 'Sales',
    template: 'Hello {name}, as discussed on our call with {senderName} from {company}, your follow-up call is scheduled for {date} at {time}. Feel free to reply here if you need any changes.',
  },
  {
    id: 'realestate_sitevisit',
    name: 'Real Estate Site Visit Confirmation',
    category: 'Real Estate',
    template: 'Hello {name}, your property site visit for {property} is confirmed for {date} at {time}. Our property advisor {agentName} will meet you at the site. Looking forward to welcoming you!',
  },
  {
    id: 'institute_fee_reminder',
    name: 'Education Fee Due Reminder',
    category: 'Institute',
    template: 'Dear {name}, this is a gentle reminder from {company} regarding the upcoming course fee installment of ₹{amount} due on {date}. Kindly ensure timely clearance. Thank you!',
  },
  {
    id: 'institute_admission_welcome',
    name: 'Admission Confirmation',
    category: 'Institute',
    template: 'Congratulations {name}! Your enrollment with {company} for batch {batch} is confirmed. We are excited to have you on board.',
  },
  {
    id: 'healthcare_appointment',
    name: 'Clinic Appointment Confirmation',
    category: 'Healthcare',
    template: 'Dear {name}, your appointment at {company} is scheduled for {date} at {time}. Please arrive 10 minutes prior to your slot.',
  },
  {
    id: 'automotive_job_ready',
    name: 'Vehicle Service Complete',
    category: 'Automotive',
    template: 'Hello {name}, your vehicle {vehicle} service has been completed at {company}. The total invoice amount is ₹{amount}. You may pick up your vehicle during workshop hours.',
  },
  {
    id: 'restaurant_reservation',
    name: 'Table Reservation Confirmation',
    category: 'Restaurant',
    template: 'Hello {name}, your table reservation for {guests} guests at {company} is confirmed for {date} at {time}. We look forward to serving you!',
  },
  {
    id: 'gym_membership',
    name: 'Fitness Plan Renewal',
    category: 'Gym',
    template: 'Hey {name}, your gym membership at {company} is due for renewal on {date}. Renew today to lock in your active member discount!',
  },
];

export const fillTemplate = (templateString, variables = {}) => {
  let result = templateString;
  Object.entries(variables).forEach(([key, val]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, val || '');
  });
  return result;
};

