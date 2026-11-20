/**
 * UPI Payment & QR Code Utilities for Radhix CRM
 * Formats standardized NPCI UPI Intent Strings and Generates Crisp QR Codes
 */

export const buildUpiPaymentUri = ({
  upiId = 'radhixtechnologies@okaxis',
  payeeName = 'Radhix Technologies',
  amount = 0,
  invoiceNumber = '',
  currency = 'INR',
}) => {
  const cleanUpi = upiId.trim();
  const cleanAmount = Number(amount || 0).toFixed(2);
  const note = invoiceNumber ? `Bill ${invoiceNumber}` : 'CRM Invoice Payment';

  const params = new URLSearchParams({
    pa: cleanUpi,
    pn: payeeName,
    am: cleanAmount,
    cu: currency,
    tn: note,
  });

  return `upi://pay?${params.toString()}`;
};

export const getUpiQrImageUrl = (upiUri, size = 220) => {
  if (!upiUri) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    upiUri
  )}&margin=10&format=svg`;
};

