const Branch = require('../models/Branch');
const Company = require('../models/Company');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const { getTenantCompanyId } = require('../utils/tenantHelper');

// Helper to determine allowed branches based on company's subscription plan
const getCompanyBranchQuota = async (companyId, isSuperAdmin = false) => {
  if (isSuperAdmin) return 999999;
  if (!companyId) return 1;
  const company = await Company.findById(companyId).populate('subscription.plan');
  if (!company) return 1;

  const planSlug = company.subscription?.planSlug || 'starter';
  if (planSlug === 'enterprise') return 100; // Unlimited
  if (planSlug === 'pro') return 3;
  return 1; // Starter default
};

// GET /api/branches - List all branches for tenant company or all (for super admin)
exports.getBranches = async (req, res) => {
  try {
    const isSuperAdmin = req.user.role?.slug === 'super_admin';
    let companyId = req.query.companyId;

    if (!isSuperAdmin || !companyId) {
      if (!companyId) {
        companyId = await getTenantCompanyId(req.user);
      }
    }

    let query = {};
    if (companyId && companyId !== 'all') {
      query.company = companyId;
    } else if (!isSuperAdmin) {
      return res.status(400).json({ success: false, message: 'Tenant company context required' });
    }

    let company = null;
    if (companyId && companyId !== 'all') {
      company = await Company.findById(companyId).populate('subscription.plan');
    }

    const maxBranches = await getCompanyBranchQuota(companyId, isSuperAdmin);

    let branches = await Branch.find(query)
      .populate('company', 'name industry')
      .populate('manager', 'name email phone')
      .sort({ isHeadOffice: -1, createdAt: 1 });

    // Auto-seed default Headquarters if specific tenant company has 0 branches
    if (branches.length === 0 && company) {
      const defaultCity = company?.address?.city || 'Headquarters City';
      const defaultHq = await Branch.create({
        company: company._id,
        name: `${company?.name || 'Company'} - Central Headquarters`,
        code: 'HQ-01',
        type: 'headquarters',
        address: {
          city: defaultCity,
          state: company?.address?.state || 'Maharashtra',
          country: company?.address?.country || 'India',
          street: company?.address?.street || 'Central Business District',
          postalCode: company?.address?.postalCode || '400001',
        },
        phone: company?.phone || '+91 98765 00000',
        email: company?.email || 'hq@company.com',
        capacity: 50,
        operatingHours: '9:00 AM - 6:30 PM (Mon-Sat)',
        isHeadOffice: true,
        isActive: true,
        notes: 'Primary corporate headquarters & administrative hub',
      });
      branches = [defaultHq];
    }

    // If Super Admin, also return list of all client tenant companies for the filter
    const companies = isSuperAdmin ? await Company.find().select('name industry') : [];

    res.json({
      success: true,
      data: branches,
      companies,
      quota: {
        current: branches.length,
        max: isSuperAdmin ? 999999 : maxBranches,
        isEnterprise: isSuperAdmin || (company?.subscription?.planSlug === 'enterprise'),
        planSlug: isSuperAdmin ? 'enterprise' : (company?.subscription?.planSlug || 'starter'),
        isSuperAdmin,
      },
    });
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch company branches', error: error.message });
  }
};

// POST /api/branches - Create new branch (enforces subscription plan quota for tenants, unlimited for superadmin)
exports.createBranch = async (req, res) => {
  try {
    const isSuperAdmin = req.user.role?.slug === 'super_admin';
    let companyId = req.body.companyId;

    if (!companyId || !isSuperAdmin) {
      companyId = await getTenantCompanyId(req.user);
    }

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Tenant company context required' });
    }

    const company = await Company.findById(companyId);
    const maxBranches = await getCompanyBranchQuota(companyId, isSuperAdmin);
    const currentCount = await Branch.countDocuments({ company: companyId, isActive: { $ne: false } });

    if (!isSuperAdmin && currentCount >= maxBranches) {
      const currentPlanName = company?.subscription?.planSlug === 'pro' ? 'Professional Suite (up to 3 branches)' : 'Starter Plan (1 branch)';
      return res.status(403).json({
        success: false,
        code: 'QUOTA_EXCEEDED',
        message: `Branch Limit Reached: Your ${currentPlanName} allows up to ${maxBranches} operational branch(es). Upgrade to Enterprise Scale to unlock Unlimited Multi-Branch Hub.`,
      });
    }

    const {
      name,
      code,
      type = 'sales_branch',
      manager,
      managerName,
      email,
      phone,
      address,
      capacity = 25,
      operatingHours = '9:30 AM - 6:30 PM (Mon-Sat)',
      isHeadOffice = false,
      notes = '',
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Branch name is required' });
    }

    if (!address?.city || !address.city.trim()) {
      return res.status(400).json({ success: false, message: 'Branch city is required' });
    }

    // Auto-generate code if not provided
    const branchCode = (code && code.trim()) ? code.trim().toUpperCase() : `BR-${Math.floor(1000 + Math.random() * 9000)}`;

    // Check duplicate code within company
    const existingCode = await Branch.findOne({ company: companyId, code: branchCode });
    if (existingCode) {
      return res.status(400).json({ success: false, message: `Branch code '${branchCode}' already exists for this business organization.` });
    }

    const newBranch = await Branch.create({
      company: companyId,
      name: name.trim(),
      code: branchCode,
      type,
      manager: manager || null,
      managerName: managerName || '',
      email: email ? email.trim() : '',
      phone: phone ? phone.trim() : '',
      address: {
        street: address.street || '',
        city: address.city.trim(),
        state: address.state || '',
        country: address.country || 'India',
        postalCode: address.postalCode || '',
      },
      capacity: Number(capacity) || 25,
      operatingHours,
      isHeadOffice: Boolean(isHeadOffice),
      isActive: true,
      notes,
    });

    const populated = await Branch.findById(newBranch._id)
      .populate('company', 'name industry')
      .populate('manager', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      data: populated,
    });
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).json({ success: false, message: 'Failed to create branch', error: error.message });
  }
};

// PUT /api/branches/:id - Update existing branch
exports.updateBranch = async (req, res) => {
  try {
    const isSuperAdmin = req.user.role?.slug === 'super_admin';
    const query = { _id: req.params.id };
    if (!isSuperAdmin) {
      query.company = await getTenantCompanyId(req.user);
    }

    const branch = await Branch.findOne(query);

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    const {
      name,
      code,
      type,
      manager,
      managerName,
      email,
      phone,
      address,
      capacity,
      operatingHours,
      isActive,
      notes,
    } = req.body;

    if (name) branch.name = name.trim();
    if (type) branch.type = type;
    if (manager !== undefined) branch.manager = manager || null;
    if (managerName !== undefined) branch.managerName = managerName;
    if (email !== undefined) branch.email = email.trim();
    if (phone !== undefined) branch.phone = phone.trim();
    if (capacity !== undefined) branch.capacity = Number(capacity);
    if (operatingHours !== undefined) branch.operatingHours = operatingHours;
    if (isActive !== undefined) branch.isActive = Boolean(isActive);
    if (notes !== undefined) branch.notes = notes;

    if (code && code.trim().toUpperCase() !== branch.code) {
      const codeCheck = await Branch.findOne({ company: branch.company, code: code.trim().toUpperCase(), _id: { $ne: branch._id } });
      if (codeCheck) {
        return res.status(400).json({ success: false, message: `Branch code '${code.trim().toUpperCase()}' is already in use.` });
      }
      branch.code = code.trim().toUpperCase();
    }

    if (address) {
      branch.address = {
        street: address.street !== undefined ? address.street : branch.address.street,
        city: address.city !== undefined ? address.city.trim() : branch.address.city,
        state: address.state !== undefined ? address.state : branch.address.state,
        country: address.country !== undefined ? address.country : branch.address.country,
        postalCode: address.postalCode !== undefined ? address.postalCode : branch.address.postalCode,
      };
    }

    await branch.save();
    const populated = await Branch.findById(branch._id)
      .populate('company', 'name industry')
      .populate('manager', 'name email phone');

    res.json({
      success: true,
      message: 'Branch updated successfully',
      data: populated,
    });
  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(500).json({ success: false, message: 'Failed to update branch', error: error.message });
  }
};

// DELETE /api/branches/:id - Delete branch
exports.deleteBranch = async (req, res) => {
  try {
    const isSuperAdmin = req.user.role?.slug === 'super_admin';
    const query = { _id: req.params.id };
    if (!isSuperAdmin) {
      query.company = await getTenantCompanyId(req.user);
    }

    const branch = await Branch.findOne(query);

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    if (branch.isHeadOffice) {
      return res.status(400).json({ success: false, message: 'Cannot delete primary corporate headquarters' });
    }

    await Branch.findByIdAndDelete(branch._id);

    res.json({
      success: true,
      message: 'Branch deleted successfully',
      deletedId: branch._id,
    });
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ success: false, message: 'Failed to delete branch', error: error.message });
  }
};
