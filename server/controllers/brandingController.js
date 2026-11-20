const Company = require('../models/Company');
const User = require('../models/User');

const DEFAULT_BRANDING = {
  brandColor: '#6366f1',
  accentColor: '#8b5cf6',
  logo: '',
  favicon: '',
  companyDisplayName: 'Radhix CRM',
  tagline: 'Modern Unified Sales & Business Management Platform',
  supportEmail: 'support@radhix.com',
  supportPhone: '+91 98765 43210',
  customDomain: '',
  invoiceHeaderNote: 'Thank you for your business! We appreciate your partnership.',
  invoiceFooterTerms: 'Payment is due within 15 days of invoice date. All disputes subject to local jurisdiction.',
  signatureUrl: '',
};

// Helper to get or create company
const resolveUserCompany = async (user) => {
  if (user && user.company) {
    const existing = await Company.findById(user.company);
    if (existing) return existing;
  }

  // Find or create default
  let company = await Company.findOne({ owner: user._id });
  if (!company) {
    company = await Company.create({
      name: `${user.name}'s Organization`,
      email: user.email,
      owner: user._id,
      upiId: 'merchant@upi',
      upiName: user.name,
      branding: {
        ...DEFAULT_BRANDING,
        companyDisplayName: `${user.name}'s CRM`,
      },
    });
    user.company = company._id;
    await User.findByIdAndUpdate(user._id, { company: company._id });
  }
  return company;
};

// GET /api/branding (Authenticated user company branding)
exports.getBranding = async (req, res) => {
  try {
    if (!req.user) {
      return res.json({ success: true, data: DEFAULT_BRANDING });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.json({ success: true, data: DEFAULT_BRANDING });
    }

    const company = await resolveUserCompany(user);
    const branding = company.branding || DEFAULT_BRANDING;

    res.json({
      success: true,
      data: {
        ...DEFAULT_BRANDING,
        ...(branding.toObject ? branding.toObject() : branding),
        companyName: company.name,
        companyEmail: company.email,
        companyPhone: company.phone,
        upiId: company.upiId,
        upiName: company.upiName,
        gstin: company.gstin,
      },
    });
  } catch (error) {
    console.error('Error fetching branding:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving branding' });
  }
};

// GET /api/branding/public (Unauthenticated / Public preview)
exports.getPublicBranding = async (req, res) => {
  try {
    const { slug } = req.query;
    if (slug) {
      const company = await Company.findOne({ slug: slug.toLowerCase() });
      if (company && company.branding) {
        return res.json({
          success: true,
          data: {
            ...DEFAULT_BRANDING,
            ...company.branding.toObject(),
            companyName: company.name,
          },
        });
      }
    }
    // Return default
    res.json({ success: true, data: DEFAULT_BRANDING });
  } catch (error) {
    console.error('Error in public branding:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/branding (Admin update branding)
exports.updateBranding = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const company = await resolveUserCompany(user);

    const {
      brandColor,
      accentColor,
      logo,
      favicon,
      companyDisplayName,
      tagline,
      supportEmail,
      supportPhone,
      customDomain,
      invoiceHeaderNote,
      invoiceFooterTerms,
      signatureUrl,
      companyName,
      companyPhone,
      companyEmail,
      upiId,
      upiName,
      gstin,
    } = req.body;

    if (!company.branding) {
      company.branding = { ...DEFAULT_BRANDING };
    }

    if (brandColor !== undefined) company.branding.brandColor = brandColor;
    if (accentColor !== undefined) company.branding.accentColor = accentColor;
    if (logo !== undefined) company.branding.logo = logo;
    if (favicon !== undefined) company.branding.favicon = favicon;
    if (companyDisplayName !== undefined) company.branding.companyDisplayName = companyDisplayName;
    if (tagline !== undefined) company.branding.tagline = tagline;
    if (supportEmail !== undefined) company.branding.supportEmail = supportEmail;
    if (supportPhone !== undefined) company.branding.supportPhone = supportPhone;
    if (customDomain !== undefined) company.branding.customDomain = customDomain;
    if (invoiceHeaderNote !== undefined) company.branding.invoiceHeaderNote = invoiceHeaderNote;
    if (invoiceFooterTerms !== undefined) company.branding.invoiceFooterTerms = invoiceFooterTerms;
    if (signatureUrl !== undefined) company.branding.signatureUrl = signatureUrl;

    if (companyName) company.name = companyName;
    if (companyPhone) company.phone = companyPhone;
    if (companyEmail) company.email = companyEmail;
    if (upiId !== undefined) company.upiId = upiId;
    if (upiName !== undefined) company.upiName = upiName;
    if (gstin !== undefined) company.gstin = gstin;

    await company.save();

    res.json({
      success: true,
      message: 'Branding and white-label settings updated successfully',
      data: {
        ...DEFAULT_BRANDING,
        ...company.branding.toObject(),
        companyName: company.name,
        companyEmail: company.email,
        companyPhone: company.phone,
        upiId: company.upiId,
        upiName: company.upiName,
        gstin: company.gstin,
      },
    });
  } catch (error) {
    console.error('Error updating branding:', error);
    res.status(500).json({ success: false, message: 'Failed to update branding settings' });
  }
};

// POST /api/branding/reset
exports.resetBranding = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const company = await resolveUserCompany(user);

    company.branding = { ...DEFAULT_BRANDING };
    await company.save();

    res.json({
      success: true,
      message: 'Branding reset to default theme successfully',
      data: {
        ...DEFAULT_BRANDING,
        companyName: company.name,
      },
    });
  } catch (error) {
    console.error('Error resetting branding:', error);
    res.status(500).json({ success: false, message: 'Failed to reset branding' });
  }
};

