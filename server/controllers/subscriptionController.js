const { getTenantUserAndEmployeeIds } = require('../utils/tenantHelper');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Company = require('../models/Company');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Lead = require('../models/Lead');
const Branch = require('../models/Branch');

const DEFAULT_PLANS = [
  {
    name: 'Starter Plan',
    slug: 'starter',
    tagline: 'Ideal for small agencies, clinics, institutes and startups getting started',
    priceMonthly: 999,
    priceYearly: 9990,
    currency: 'INR',
    isPopular: false,
    isActive: true,
    features: [
      'Up to 5 Team Members',
      'Up to 1,000 Active Leads',
      '1 Specialized Industry Suite (e.g. Real Estate or Coaching)',
      'Core Sales CRM & Attendance Tracking',
      'Standard Quotation & Invoicing',
      'Community & Email Support',
    ],
    limits: {
      maxEmployees: 5,
      maxLeads: 1000,
      maxStorageGB: 5,
      maxBranches: 1,
    },
    allowedSuites: ['institute', 'real-estate'],
    allowedModules: ['dashboard', 'employee', 'sales', 'hrm'],
  },
  {
    name: 'Professional Suite',
    slug: 'pro',
    tagline: 'Best for growing multi-department businesses that need full automation',
    priceMonthly: 2999,
    priceYearly: 29990,
    currency: 'INR',
    isPopular: true,
    isActive: true,
    features: [
      'Up to 25 Team Members',
      'Up to 10,000 Active Leads',
      'Up to 3 Specialized Industry Suites',
      'Full HRM (Recruitment, Policies, Appraisals)',
      'Complete Finance & Payroll Processing',
      'WhatsApp Click-to-Chat & Template Engine',
      'Dynamic UPI QR Codes on Invoices',
      'Priority Support',
    ],
    limits: {
      maxEmployees: 25,
      maxLeads: 10000,
      maxStorageGB: 25,
      maxBranches: 3,
    },
    allowedSuites: ['all'],
    allowedModules: ['dashboard', 'employee', 'sales', 'hrm', 'finance', 'operations', 'reports'],
  },
  {
    name: 'Enterprise Scale',
    slug: 'enterprise',
    tagline: 'For established firms, hospital chains, real estate developers and conglomerates',
    priceMonthly: 7999,
    priceYearly: 79990,
    currency: 'INR',
    isPopular: false,
    isActive: true,
    features: [
      'Unlimited Team Members',
      'Unlimited Leads & Contacts',
      'All 11 Industry Suites Unlocked',
      'AI Lead Scoring & Automated Workflows',
      'Public Embeddable Lead Capture Widgets',
      'Custom Role Permissions & Multi-Branch Hub',
      'Dedicated Account Manager & 99.9% SLA',
      'Custom Domain & Brand Whitelabeling',
    ],
    limits: {
      maxEmployees: 100000,
      maxLeads: 5000000,
      maxStorageGB: 200,
      maxBranches: 100,
    },
    allowedSuites: ['all'],
    allowedModules: ['dashboard', 'employee', 'sales', 'hrm', 'finance', 'operations', 'reports', 'settings'],
  },
];

// Helper to seed plans if collection is empty
const ensureDefaultPlans = async () => {
  const count = await SubscriptionPlan.countDocuments();
  if (count === 0) {
    await SubscriptionPlan.insertMany(DEFAULT_PLANS);
    console.log('[SaaS Engine] Default subscription plans seeded successfully.');
  } else {
    // Ensure existing seeded plans have updated limits including maxBranches
    for (const dp of DEFAULT_PLANS) {
      await SubscriptionPlan.updateOne(
        { slug: dp.slug },
        {
          $set: {
            'limits.maxBranches': dp.limits.maxBranches,
            'limits.maxEmployees': dp.limits.maxEmployees,
            'limits.maxLeads': dp.limits.maxLeads,
          },
        }
      );
    }
  }
};

// Helper to get or create company for current user
const getOrCreateCompanyForUser = async (user) => {
  if (user.company) {
    const existing = await Company.findById(user.company).populate('subscription.plan');
    if (existing) return existing;
  }

  // Create default company
  await ensureDefaultPlans();
  const proPlan = await SubscriptionPlan.findOne({ slug: 'pro' }) || await SubscriptionPlan.findOne();

  const newCompany = await Company.create({
    name: `${user.name}'s Organization`,
    email: user.email,
    owner: user._id,
    upiId: 'merchant@upi',
    upiName: user.name,
    subscription: {
      plan: proPlan?._id,
      planSlug: proPlan?.slug || 'pro',
      status: 'trial',
      billingCycle: 'monthly',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      allowedSuites: ['all'],
    },
  });

  user.company = newCompany._id;
  await User.findByIdAndUpdate(user._id, { company: newCompany._id });

  return newCompany;
};

// Public/Protected: Get all active plans
exports.getPlans = async (req, res) => {
  try {
    await ensureDefaultPlans();
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ priceMonthly: 1 });
    res.json({ success: true, data: plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subscription plans' });
  }
};

// Protected: Get current company subscription and live usage metrics
exports.getMySubscription = async (req, res) => {
  try {
    const company = await getOrCreateCompanyForUser(req.user);
    const plan = await SubscriptionPlan.findOne({ slug: company.subscription.planSlug }) ||
      await SubscriptionPlan.findById(company.subscription.plan) ||
      DEFAULT_PLANS[1];

    // Calculate tenant-isolated usage statistics
    const { userIds: tenantUserIds, employeeIds: tenantEmployeeIds } = await getTenantUserAndEmployeeIds(company._id);
    const employeeCount = await Employee.countDocuments({
      status: { $ne: 'terminated' },
      $or: [{ company: company._id }, { user: { $in: tenantUserIds } }],
    });
    const leadCount = await Lead.countDocuments({
      isDeleted: { $ne: true },
      $or: [
        { tenantCompany: company._id },
        { createdBy: { $in: tenantUserIds } },
        ...(tenantEmployeeIds.length || tenantUserIds.length ? [{ assignedTo: { $in: [...tenantEmployeeIds, ...tenantUserIds] } }] : []),
      ],
    });

    const branchCount = await Branch.countDocuments({ company: company._id, isActive: true });
    const maxBranches = plan.limits?.maxBranches || (plan.slug === 'enterprise' ? 100 : plan.slug === 'pro' ? 3 : 1);

    // Calculate days remaining
    const now = new Date();
    const endDate = company.subscription.status === 'trial'
      ? company.subscription.trialEndsAt
      : company.subscription.currentPeriodEnd;
    const daysRemaining = Math.max(0, Math.ceil((new Date(endDate) - now) / (1000 * 60 * 60 * 24)));

    res.json({
      success: true,
      data: {
        company: {
          _id: company._id,
          name: company.name,
          email: company.email,
          phone: company.phone,
          logo: company.logo,
          industry: company.industry,
          upiId: company.upiId,
          upiName: company.upiName,
          address: company.address,
          gstin: company.gstin,
        },
        subscription: company.subscription,
        plan: {
          name: plan.name,
          slug: plan.slug,
          priceMonthly: plan.priceMonthly,
          priceYearly: plan.priceYearly,
          currency: plan.currency,
          features: plan.features,
          limits: plan.limits,
          allowedSuites: plan.allowedSuites,
        },
        usage: {
          employees: {
            current: employeeCount,
            limit: plan.limits?.maxEmployees || 25,
            percentage: Math.min(100, Math.round((employeeCount / (plan.limits?.maxEmployees || 25)) * 100)),
          },
          leads: {
            current: leadCount,
            limit: plan.limits?.maxLeads || 10000,
            percentage: Math.min(100, Math.round((leadCount / (plan.limits?.maxLeads || 10000)) * 100)),
          },
          branches: {
            current: branchCount,
            limit: maxBranches,
            percentage: Math.min(100, Math.round((branchCount / maxBranches) * 100)),
          },
          daysRemaining,
          isExpiringSoon: daysRemaining <= 3,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subscription details' });
  }
};

// Protected: Update company profile & UPI payment details
exports.updateCompanySettings = async (req, res) => {
  try {
    const company = await getOrCreateCompanyForUser(req.user);
    const { name, email, phone, industry, upiId, upiName, address, gstin, logo } = req.body;

    if (name) company.name = name.trim();
    if (email) company.email = email.trim();
    if (phone) company.phone = phone.trim();
    if (industry) company.industry = industry;
    if (upiId !== undefined) company.upiId = upiId.trim();
    if (upiName !== undefined) company.upiName = upiName.trim();
    if (gstin !== undefined) company.gstin = gstin.trim();
    if (logo !== undefined) company.logo = logo;
    if (address) company.address = { ...company.address, ...address };

    await company.save();

    res.json({
      success: true,
      message: 'Company settings updated successfully',
      data: company,
    });
  } catch (error) {
    console.error('Error updating company settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update company settings' });
  }
};

// Protected: Change or upgrade subscription plan
exports.changePlan = async (req, res) => {
  try {
    const { planSlug, billingCycle = 'monthly' } = req.body;
    if (!planSlug) {
      return res.status(400).json({ success: false, message: 'Plan slug is required' });
    }

    const plan = await SubscriptionPlan.findOne({ slug: planSlug, isActive: true });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Selected plan not found' });
    }

    const company = await getOrCreateCompanyForUser(req.user);
    const periodDays = billingCycle === 'yearly' ? 365 : 30;

    company.subscription.plan = plan._id;
    company.subscription.planSlug = plan.slug;
    company.subscription.status = 'active';
    company.subscription.billingCycle = billingCycle;
    company.subscription.currentPeriodStart = new Date();
    company.subscription.currentPeriodEnd = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000);
    company.subscription.allowedSuites = plan.allowedSuites;

    await company.save();

    res.json({
      success: true,
      message: `Successfully updated subscription to ${plan.name}`,
      data: company.subscription,
    });
  } catch (error) {
    console.error('Error changing plan:', error);
    res.status(500).json({ success: false, message: 'Failed to update subscription plan' });
  }
};

// SuperAdmin: List all tenant companies
exports.getAllTenants = async (req, res) => {
  try {
    const companies = await Company.find()
      .populate('owner', 'name email phone')
      .populate('subscription.plan')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: companies });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tenant companies' });
  }
};

// SuperAdmin: Update tenant company subscription
exports.updateTenantSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { planSlug, status, extendDays, allowedSuites } = req.body;

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    if (planSlug) {
      const plan = await SubscriptionPlan.findOne({ slug: planSlug });
      if (plan) {
        company.subscription.plan = plan._id;
        company.subscription.planSlug = plan.slug;
      }
    }

    if (status) {
      company.subscription.status = status;
    }

    if (allowedSuites) {
      company.subscription.allowedSuites = allowedSuites;
    }

    if (extendDays && Number(extendDays) > 0) {
      const currentEnd = new Date(company.subscription.currentPeriodEnd || Date.now());
      company.subscription.currentPeriodEnd = new Date(currentEnd.getTime() + Number(extendDays) * 24 * 60 * 60 * 1000);
    }

    await company.save();

    res.json({
      success: true,
      message: 'Tenant subscription updated successfully',
      data: company,
    });
  } catch (error) {
    console.error('Error updating tenant subscription:', error);
    res.status(500).json({ success: false, message: 'Failed to update tenant subscription' });
  }
};

// SuperAdmin: Onboard a new business client (Company + Admin User + Subscription)
exports.createTenantCompany = async (req, res) => {
  try {
    const {
      companyName,
      ownerName,
      ownerEmail,
      ownerPhone,
      password,
      industry = 'real-estate',
      planSlug = 'pro',
      billingCycle = 'yearly',
      durationMonths = 12,
    } = req.body;

    if (!companyName || !ownerName || !ownerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Company name, owner name, and owner email are required',
      });
    }

    const emailNorm = ownerEmail.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: emailNorm });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `An account with email "${emailNorm}" already exists`,
      });
    }

    await ensureDefaultPlans();
    const plan = (await SubscriptionPlan.findOne({ slug: planSlug })) || (await SubscriptionPlan.findOne());

    const plainPassword = password && password.trim().length >= 6 ? password.trim() : 'Welcome@2026';

    // 1. Create the Admin User for this business
    const user = await User.create({
      name: ownerName.trim(),
      email: emailNorm,
      password: plainPassword,
      role: 'admin',
      isActive: true,
      modulesAccess: { all: true },
    });

    // 2. Create the Company / Tenant
    const now = new Date();
    const months = Number(durationMonths) || 12;
    const periodEnd = new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000);

    const company = await Company.create({
      name: companyName.trim(),
      email: emailNorm,
      phone: ownerPhone ? ownerPhone.trim() : '',
      industry: industry.toLowerCase().trim(),
      owner: user._id,
      upiId: 'merchant@upi',
      upiName: companyName.trim(),
      subscription: {
        plan: plan?._id,
        planSlug: plan?.slug || planSlug,
        status: 'active',
        billingCycle: billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        allowedSuites: [industry.toLowerCase().trim()],
      },
    });

    // Link user to company
    user.company = company._id;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Business account successfully created!',
      data: {
        company,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        credentials: {
          loginUrl: `${req.protocol}://${req.get('host')}/login`,
          email: user.email,
          password: plainPassword,
          companyName: company.name,
          industry: company.industry,
        },
      },
    });
  } catch (error) {
    console.error('Error creating tenant company:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create business account' });
  }
};

// SuperAdmin: Get full 360-degree overview and metrics of a single tenant
exports.getTenantDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id)
      .populate('owner', 'name email phone role createdAt lastLogin')
      .populate('subscription.plan');

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const { userIds } = await getTenantUserAndEmployeeIds(company._id);
    const compObjId = company._id;

    // Core Metrics
    const employeesCount = await Employee.countDocuments({
      $or: [{ company: compObjId }, { user: { $in: userIds } }],
      deletedAt: null,
    });

    const Lead = require('../models/Lead');
    const leadsCount = await Lead.countDocuments({
      $or: [{ company: compObjId }, { createdBy: { $in: userIds } }],
    });

    const Deal = require('../models/Deal');
    const deals = await Deal.find({
      $or: [{ company: compObjId }, { createdBy: { $in: userIds } }],
    }).select('value stage status');
    const dealsCount = deals.length;
    const totalDealValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
    const wonDealsCount = deals.filter(d => d.stage === 'closed-won' || d.status === 'won').length;

    const Invoice = require('../models/Invoice');
    const invoices = await Invoice.find({
      $or: [{ company: compObjId }, { createdBy: { $in: userIds } }],
    }).select('total status');
    const invoicesCount = invoices.length;
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    const pendingInvoicesCount = invoices.filter(inv => inv.status === 'sent' || inv.status === 'pending').length;

    // Industry Specific Metrics
    let industryMetrics = {};
    const ind = company.industry || 'general';

    if (ind === 'real-estate') {
      const Property = require('../models/RealEstateProperty');
      const SiteVisit = require('../models/RealEstateSiteVisit');
      const Booking = require('../models/RealEstateBooking');
      industryMetrics = {
        propertiesCount: await Property.countDocuments({ company: compObjId }),
        siteVisitsCount: await SiteVisit.countDocuments({ company: compObjId }),
        bookingsCount: await Booking.countDocuments({ company: compObjId }),
      };
    } else if (ind === 'institute') {
      const Student = require('../models/Student');
      const Course = require('../models/Course');
      const Batch = require('../models/Batch');
      industryMetrics = {
        studentsCount: await Student.countDocuments({ company: compObjId }),
        coursesCount: await Course.countDocuments({ company: compObjId }),
        batchesCount: await Batch.countDocuments({ company: compObjId }),
      };
    } else if (ind === 'healthcare') {
      const Patient = require('../models/HealthcarePatient');
      const Appointment = require('../models/HealthcareAppointment');
      industryMetrics = {
        patientsCount: await Patient.countDocuments({ company: compObjId }),
        appointmentsCount: await Appointment.countDocuments({ company: compObjId }),
      };
    } else if (ind === 'gym') {
      const Member = require('../models/GymMember');
      const Trainer = require('../models/GymTrainer');
      industryMetrics = {
        membersCount: await Member.countDocuments({ company: compObjId }),
        trainersCount: await Trainer.countDocuments({ company: compObjId }),
      };
    } else if (ind === 'restaurant') {
      const Menu = require('../models/RestaurantMenuItem');
      const Order = require('../models/RestaurantOrder');
      industryMetrics = {
        menuItemsCount: await Menu.countDocuments({ company: compObjId }),
        ordersCount: await Order.countDocuments({ company: compObjId }),
      };
    } else if (ind === 'construction') {
      const Project = require('../models/ConstructionProject');
      industryMetrics = {
        projectsCount: await Project.countDocuments({ company: compObjId }),
      };
    } else if (ind === 'automotive') {
      const Vehicle = require('../models/AutomotiveVehicle');
      const Job = require('../models/AutomotiveServiceJob');
      industryMetrics = {
        vehiclesCount: await Vehicle.countDocuments({ company: compObjId }),
        jobsCount: await Job.countDocuments({ company: compObjId }),
      };
    } else if (ind === 'travel') {
      const Pkg = require('../models/TravelPackage');
      const Booking = require('../models/TravelBooking');
      industryMetrics = {
        packagesCount: await Pkg.countDocuments({ company: compObjId }),
        bookingsCount: await Booking.countDocuments({ company: compObjId }),
      };
    } else if (ind === 'manufacturing') {
      const Prod = require('../models/ManufacturingProduct');
      const Ord = require('../models/ManufacturingOrder');
      industryMetrics = {
        productsCount: await Prod.countDocuments({ company: compObjId }),
        ordersCount: await Ord.countDocuments({ company: compObjId }),
      };
    } else if (ind === 'salon') {
      const Serv = require('../models/SalonService');
      const Appt = require('../models/SalonAppointment');
      industryMetrics = {
        servicesCount: await Serv.countDocuments({ company: compObjId }),
        appointmentsCount: await Appt.countDocuments({ company: compObjId }),
      };
    } else if (ind === 'retail') {
      const Prod = require('../models/RetailProduct');
      const Ord = require('../models/RetailOrder');
      industryMetrics = {
        productsCount: await Prod.countDocuments({ company: compObjId }),
        ordersCount: await Ord.countDocuments({ company: compObjId }),
      };
    }

    const now = Date.now();
    const periodEnd = company.subscription?.currentPeriodEnd ? new Date(company.subscription.currentPeriodEnd).getTime() : now;
    const daysRemaining = Math.max(0, Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24)));

    const usersList = await User.find({ company: compObjId })
      .select('name email role isActive createdAt')
      .populate('role', 'name slug');

    res.json({
      success: true,
      data: {
        company,
        owner: company.owner,
        daysRemaining,
        metrics: {
          employeesCount,
          leadsCount,
          dealsCount,
          totalDealValue,
          wonDealsCount,
          invoicesCount,
          totalRevenue,
          pendingInvoicesCount,
          ...industryMetrics,
        },
        users: usersList,
      },
    });
  } catch (error) {
    console.error('Error fetching tenant details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tenant details' });
  }
};

// SuperAdmin: Impersonate (Login As) Tenant Owner
exports.impersonateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id).populate('owner');
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    let ownerUser = company.owner;
    if (!ownerUser) {
      ownerUser = await User.findOne({ company: company._id, role: 'admin' });
    }

    if (!ownerUser) {
      return res.status(404).json({ success: false, message: 'Owner user account not found for this company' });
    }

    const generateToken = require('../utils/generateToken');
    const token = generateToken(ownerUser._id);
    const Session = require('../models/Session');
    const session = await Session.create({
      user: ownerUser._id,
      token,
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || 'Impersonation-Session',
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
    });

    const Role = require('../models/Role');
    const role = await Role.findOne({ slug: ownerUser.role }).lean();

    const userData = {
      _id: ownerUser._id,
      name: ownerUser.name,
      email: ownerUser.email,
      role: role || { slug: ownerUser.role, name: ownerUser.role, modules: [] },
      department: ownerUser.department,
      avatar: ownerUser.avatar,
      isActive: ownerUser.isActive,
      modulesAccess: ownerUser.modulesAccess || {},
      company: company,
      isImpersonated: true,
      impersonatedBy: req.user?.email || 'Super Admin',
    };

    res.json({
      success: true,
      message: `Impersonating ${company.name} as ${ownerUser.name}`,
      token,
      sessionId: session._id,
      data: userData,
    });
  } catch (error) {
    console.error('Error in impersonation:', error);
    res.status(500).json({ success: false, message: 'Failed to impersonate tenant' });
  }
};

// SuperAdmin: Reset Tenant Password
exports.resetTenantPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const company = await Company.findById(id).populate('owner');
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    let user = company.owner;
    if (!user) {
      user = await User.findOne({ company: company._id, role: 'admin' });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    const pwd = newPassword || 'Welcome@2026';
    user.password = pwd;
    await user.save();

    res.json({
      success: true,
      message: `Password for ${user.email} successfully updated to: ${pwd}`,
      credentials: {
        email: user.email,
        password: pwd,
      },
    });
  } catch (error) {
    console.error('Error resetting tenant password:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

// SuperAdmin: Update Tenant Company Profile & Quotas
exports.updateTenantCompanyProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, industry, upiId, upiName, gstin, planSlug, status, expiryDate } = req.body;

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    if (name) company.name = name;
    if (email) company.email = email;
    if (phone) company.phone = phone;
    if (industry) company.industry = industry;
    if (upiId !== undefined) company.upiId = upiId;
    if (upiName !== undefined) company.upiName = upiName;
    if (gstin !== undefined) company.gstin = gstin;

    if (planSlug) {
      company.subscription.planSlug = planSlug;
      const plan = await SubscriptionPlan.findOne({ slug: planSlug });
      if (plan) company.subscription.plan = plan._id;
    }

    if (status) {
      company.subscription.status = status;
    }

    if (expiryDate) {
      company.subscription.currentPeriodEnd = new Date(expiryDate);
    }

    await company.save();

    res.json({
      success: true,
      message: 'Business profile updated successfully',
      data: company,
    });
  } catch (error) {
    console.error('Error updating tenant profile:', error);
    res.status(500).json({ success: false, message: 'Failed to update company profile' });
  }
};

