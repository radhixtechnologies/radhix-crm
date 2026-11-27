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
  invoiceFooterTerms: '1. Interest @24% P.A. will be charged extra if not paid within due date.\n2. Goods/Services once billed will not be reversed.\n3. All disputes subject to local jurisdiction.',
  signatureUrl: '',
  signatoryName: '',
  declarationText: 'Certified that Particulars given above are true & correct under GST Act 2017 and amount indicated represent the price actually charged and that there is no flow of additional consideration directly or indirectly from buyer.',
  jurisdiction: '',
};

const formatBrandingResponse = (company) => {
  const brandingObj = company.branding?.toObject ? company.branding.toObject() : (company.branding || {});
  const addressObj = company.address?.toObject ? company.address.toObject() : (company.address || {});
  const bankObj = company.bankDetails?.toObject ? company.bankDetails.toObject() : (company.bankDetails || {});
  return {
    ...DEFAULT_BRANDING,
    ...brandingObj,
    companyName: company.name || '',
    companyEmail: company.email || '',
    companyPhone: company.phone || '',
    upiId: company.upiId || '',
    upiName: company.upiName || '',
    gstin: company.gstin || '',
    pan: company.pan || '',
    cin: company.cin || '',
    website: company.website || '',
    stateName: company.stateName || addressObj.state || '',
    stateCode: company.stateCode || '',
    address: {
      street: addressObj.street || '',
      city: addressObj.city || '',
      state: addressObj.state || '',
      postalCode: addressObj.postalCode || '',
      country: addressObj.country || 'India',
    },
    bankDetails: {
      bankName: bankObj.bankName || '',
      branch: bankObj.branch || '',
      accountNumber: bankObj.accountNumber || '',
      ifscCode: bankObj.ifscCode || '',
    },
  };
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

    res.json({
      success: true,
      data: formatBrandingResponse(company),
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
      signatoryName,
      declarationText,
      jurisdiction,
      companyName,
      companyPhone,
      companyEmail,
      upiId,
      upiName,
      gstin,
      pan,
      cin,
      website,
      stateName,
      stateCode,
      address,
      bankDetails,
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
    if (signatoryName !== undefined) company.branding.signatoryName = signatoryName;
    if (declarationText !== undefined) company.branding.declarationText = declarationText;
    if (jurisdiction !== undefined) company.branding.jurisdiction = jurisdiction;

    if (companyName) company.name = companyName;
    if (companyPhone !== undefined) company.phone = companyPhone;
    if (companyEmail !== undefined) company.email = companyEmail;
    if (upiId !== undefined) company.upiId = upiId;
    if (upiName !== undefined) company.upiName = upiName;
    if (gstin !== undefined) company.gstin = gstin;
    if (pan !== undefined) company.pan = pan;
    if (cin !== undefined) company.cin = cin;
    if (website !== undefined) company.website = website;
    if (stateName !== undefined) company.stateName = stateName;
    if (stateCode !== undefined) company.stateCode = stateCode;
    if (address && typeof address === 'object') {
      company.address = { ...(company.address?.toObject?.() || company.address || {}), ...address };
    }
    if (bankDetails && typeof bankDetails === 'object') {
      company.bankDetails = { ...(company.bankDetails?.toObject?.() || company.bankDetails || {}), ...bankDetails };
    }

    await company.save();

    res.json({
      success: true,
      message: 'Branding and white-label settings updated successfully',
      data: formatBrandingResponse(company),
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

