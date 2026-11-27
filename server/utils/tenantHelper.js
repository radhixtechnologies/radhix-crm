const mongoose = require('mongoose');
const Company = require('../models/Company');
const User = require('../models/User');

// In-memory cache with TTL for multi-tenant mapping
const tenantIdsCache = new Map();
const tenantCompanyCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

function getCached(cache, key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(cache, key, data, ttl = CACHE_TTL_MS) {
  cache.set(key, { data, expiresAt: Date.now() + ttl });
}

function invalidateTenantCache(companyId) {
  if (companyId) {
    tenantIdsCache.delete(companyId.toString());
  } else {
    tenantIdsCache.clear();
    tenantCompanyCache.clear();
  }
}

/**
 * Get tenant company ID for a user.
 * Returns null if user is super_admin (meaning no tenant boundary).
 *
 * @param {Object} user - Authenticated user object
 * @returns {Promise<string|null>} Company ID string or null
 */
async function getTenantCompanyId(user) {
  if (!user) return null;
  const roleSlug = typeof user.role === 'object' ? user.role?.slug : user.role;
  if (roleSlug === 'super_admin') return null;

  if (user.company) {
    return user.company._id ? user.company._id.toString() : user.company.toString();
  }

  const userIdStr = user._id ? user._id.toString() : user.toString();
  const cachedCompanyId = getCached(tenantCompanyCache, userIdStr);
  if (cachedCompanyId !== null) {
    return cachedCompanyId;
  }

  // Check if user is owner of a company
  const owned = await Company.findOne({ owner: user._id }).select('_id');
  if (owned) {
    const compId = owned._id.toString();
    setCached(tenantCompanyCache, userIdStr, compId);
    await User.findByIdAndUpdate(user._id, { company: owned._id });
    return compId;
  }

  setCached(tenantCompanyCache, userIdStr, null, 10000);
  return null;
}

/**
 * Retrieves all User IDs and Employee IDs belonging to a tenant company.
 *
 * @param {string|mongoose.Types.ObjectId} companyId
 * @returns {Promise<{ userIds: mongoose.Types.ObjectId[], employeeIds: mongoose.Types.ObjectId[] }>}
 */
async function getTenantUserAndEmployeeIds(companyId) {
  if (!companyId) return { userIds: [], employeeIds: [] };

  const compIdStr = companyId.toString();
  const cached = getCached(tenantIdsCache, compIdStr);
  if (cached) {
    return cached;
  }

  const compObjId = mongoose.isValidObjectId(companyId) ? new mongoose.Types.ObjectId(companyId) : companyId;
  const users = await User.find({ company: compObjId }).select('_id').lean();
  const userIds = users.map((u) => u._id);

  // Lazy require Employee to prevent circular reference
  const Employee = require('../models/Employee');
  const employees = await Employee.find({
    $or: [
      { company: compObjId },
      { user: { $in: userIds } },
    ],
  }).select('_id user').lean();

  const employeeIds = employees.map((e) => e._id);
  const employeeUserIds = employees.map((e) => e.user).filter(Boolean);

  const combinedUserIds = Array.from(new Set([
    ...userIds.map((id) => id.toString()),
    ...employeeUserIds.map((id) => id.toString()),
  ])).map((id) => new mongoose.Types.ObjectId(id));

  const result = { userIds: combinedUserIds, employeeIds };
  setCached(tenantIdsCache, compIdStr, result);
  return result;
}

/**
 * Enforces multi-tenant data isolation on MongoDB query objects.
 * Guarantees that tenants NEVER see data from other tenants or from super_admin demo data.
 *
 * @param {Object} query - Existing MongoDB query object
 * @param {Object} user - Authenticated user
 * @param {string} modelType - Entity type ('employee', 'realEstateProperty', 'lead', etc.)
 * @returns {Promise<Object>} Safe, tenant-isolated query
 */
async function applyTenantScope(query = {}, user, modelType = 'default') {
  if (!user) return query;
  const roleSlug = typeof user.role === 'object' ? user.role?.slug : user.role;
  if (roleSlug === 'super_admin') return query;

  const companyId = await getTenantCompanyId(user);
  if (!companyId) {
    // Isolated user without company: restrict to own records only
    if (modelType === 'employee') {
      const Employee = require('../models/Employee');
      const selfEmp = await Employee.findOne({ user: user._id, deletedAt: null }).select('_id');
      const ownId = selfEmp?._id || new mongoose.Types.ObjectId();
      return query && Object.keys(query).length > 0
        ? { $and: [query, { _id: ownId }] }
        : { _id: ownId };
    }
    if (modelType === 'lead') {
      const Employee = require('../models/Employee');
      const selfEmp = await Employee.findOne({ user: user._id, deletedAt: null }).select('_id');
      const assigneeIds = selfEmp ? [selfEmp._id, user._id] : [user._id];
      const leadOwnCondition = {
        $or: [
          { createdBy: user._id },
          { assignedTo: { $in: assigneeIds } },
        ],
      };
      return query && Object.keys(query).length > 0
        ? { $and: [query, leadOwnCondition] }
        : leadOwnCondition;
    }
    return query && Object.keys(query).length > 0
      ? { $and: [query, { createdBy: user._id }] }
      : { createdBy: user._id };
  }

  const { userIds, employeeIds } = await getTenantUserAndEmployeeIds(companyId);
  const compObjId = new mongoose.Types.ObjectId(companyId);

  let tenantCondition;
  if (modelType === 'employee') {
    tenantCondition = {
      $or: [
        { company: compObjId },
        { user: { $in: userIds } },
      ],
    };
  } else if (modelType === 'attendance' || modelType === 'leave') {
    tenantCondition = {
      employee: { $in: employeeIds.length > 0 ? employeeIds : [new mongoose.Types.ObjectId()] },
    };
  } else if (modelType === 'realEstateProperty') {
    tenantCondition = {
      $or: [
        { company: compObjId },
        { createdBy: { $in: userIds } },
      ],
    };
  } else if (modelType === 'realEstateSiteVisit' || modelType === 'realEstateBooking' || modelType === 'realEstateOffer') {
    tenantCondition = {
      $or: [
        { company: compObjId },
        { createdBy: { $in: userIds } },
        ...(employeeIds.length ? [{ assignedAgent: { $in: employeeIds } }] : []),
      ],
    };
  } else if (modelType === 'lead') {
    tenantCondition = {
      $or: [
        { tenantCompany: compObjId },
        { createdBy: { $in: userIds } },
        ...(employeeIds.length || userIds.length ? [{ assignedTo: { $in: [...employeeIds, ...userIds] } }] : []),
      ],
    };
  } else if (modelType === 'deal') {
    tenantCondition = {
      $or: [
        { tenantCompany: compObjId },
        { createdBy: { $in: userIds } },
        ...(userIds.length ? [{ assignedTo: { $in: userIds } }] : []),
      ],
    };
  } else {
    // Default condition for all other industry & system models
    tenantCondition = {
      $or: [
        { company: compObjId },
        { createdBy: { $in: userIds } },
      ],
    };
  }

  if (!query || Object.keys(query).length === 0) {
    return tenantCondition;
  }

  // If query already contains $and, append tenantCondition
  if (query.$and && Array.isArray(query.$and)) {
    return {
      ...query,
      $and: [...query.$and, tenantCondition],
    };
  }

  return { $and: [query, tenantCondition] };
}

module.exports = {
  getTenantCompanyId,
  getTenantUserAndEmployeeIds,
  applyTenantScope,
  invalidateTenantCache,
};
