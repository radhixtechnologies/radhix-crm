const Activity = require('../models/Activity');

/**
 * Middleware to log field changes as activities
 * Compares old and new lead data and creates activity entries for changes
 */

// Field labels for user-friendly display
const FIELD_LABELS = {
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    company: 'Company',
    title: 'Job Title',
    website: 'Website',
    status: 'Status',
    priority: 'Priority',
    leadSource: 'Lead Source',
    industry: 'Industry',
    assignedTo: 'Assigned To',
    estimatedValue: 'Estimated Value',
    currency: 'Currency',
    expectedCloseDate: 'Expected Close Date',
    address: 'Address',
    city: 'City',
    state: 'State',
    country: 'Country',
    postalCode: 'Postal Code',
    tags: 'Tags',
    description: 'Description',
    notes: 'Notes',
    source: 'Source',
    value: 'Value'
};

// Fields to track for changes
const TRACKED_FIELDS = Object.keys(FIELD_LABELS);

/**
 * Format value for display based on field type
 */
const formatValue = (fieldName, value) => {
    if (value === null || value === undefined || value === '') {
        return '(empty)';
    }

    // Handle arrays (like tags)
    if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : '(empty)';
    }

    // Handle assignedTo (Employee with populated user)
    if (fieldName === 'assignedTo' && typeof value === 'object') {
        if (value.user && typeof value.user === 'object') {
            return value.user.name || value.user.email || 'Employee';
        }
        if (value.user) {
            return 'Employee';
        }
        return value._id || 'Employee';
    }

    // Handle objects (like owner)
    if (typeof value === 'object' && value._id) {
        return value.name || value.email || value._id;
    }

    // Handle currency
    if (fieldName === 'estimatedValue' || fieldName === 'value') {
        return `$${parseFloat(value).toLocaleString()}`;
    }

    // Handle dates
    if (fieldName === 'expectedCloseDate' && value) {
        return new Date(value).toLocaleDateString();
    }

    return String(value);
};

/**
 * Determine activity type based on field
 */
const getActivityType = (fieldName) => {
    if (fieldName === 'status') return 'status-change';
    if (fieldName === 'assignedTo') return 'assignment';
    return 'field-change';
};

/**
 * Compare two values for equality
 */
const valuesAreEqual = (val1, val2) => {
    // Handle null/undefined
    if (val1 === val2) return true;
    if (!val1 && !val2) return true;
    if (!val1 || !val2) return false;

    // Handle arrays
    if (Array.isArray(val1) && Array.isArray(val2)) {
        if (val1.length !== val2.length) return false;
        return val1.every((item, index) => item === val2[index]);
    }

    // Handle objects (like populated references)
    if (typeof val1 === 'object' && typeof val2 === 'object') {
        const id1 = val1._id || val1;
        const id2 = val2._id || val2;
        return String(id1) === String(id2);
    }

    return String(val1) === String(val2);
};

/**
 * Main middleware function to log lead changes
 */
const logLeadChanges = async (oldLead, newLead, userId) => {
    try {
        const changes = [];

        // Find employee record for the user
        const Employee = require('../models/Employee');
        const employee = await Employee.findOne({ user: userId });

        if (!employee) {
            console.log('[Activity Logger] No employee record found for user, skipping activity logging');
            return [];
        }

        // Compare each tracked field
        for (const fieldName of TRACKED_FIELDS) {
            const oldValue = oldLead[fieldName];
            const newValue = newLead[fieldName];

            // Skip if values are the same
            if (valuesAreEqual(oldValue, newValue)) {
                continue;
            }

            // Determine change type
            let changeType = 'updated';
            if (!oldValue && newValue) changeType = 'added';
            if (oldValue && !newValue) changeType = 'removed';

            // Create activity for this change
            const activityData = {
                type: getActivityType(fieldName),
                subject: `${FIELD_LABELS[fieldName]} ${changeType}`,
                description: `${FIELD_LABELS[fieldName]} changed from "${formatValue(fieldName, oldValue)}" to "${formatValue(fieldName, newValue)}"`,
                status: 'completed',
                completedAt: new Date(),
                priority: fieldName === 'status' ? 'high' : 'medium',
                assignedTo: employee._id,  // Use Employee ID
                createdBy: userId,
                relatedTo: {
                    entityType: 'Lead',
                    entityId: newLead._id
                },
                changeDetails: {
                    fieldName,
                    fieldLabel: FIELD_LABELS[fieldName],
                    oldValue: formatValue(fieldName, oldValue),
                    newValue: formatValue(fieldName, newValue),
                    changeType
                }
            };

            changes.push(activityData);
        }

        // Create all activities in bulk
        if (changes.length > 0) {
            await Activity.insertMany(changes);
            console.log(`[Activity Logger] Created ${changes.length} change activities for lead ${newLead._id}`);
        }

        return changes;
    } catch (error) {
        console.error('[Activity Logger] Error logging lead changes:', error);
        // Don't throw - we don't want to fail the lead update if activity logging fails
        return [];
    }
};

module.exports = {
    logLeadChanges,
    FIELD_LABELS,
    formatValue
};
