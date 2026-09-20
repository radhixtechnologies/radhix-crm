const Contact = require('../models/Contact');
const Lead = require('../models/Lead');
const Deal = require('../models/Deal');
const Employee = require('../models/Employee');

// @desc    Get all contacts
// @route   GET /api/contacts
// @access  Private
exports.getAllContacts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            status,
            lifecycleStage,
            assignedTo,
            client,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = req.query;

        // Build query
        const query = {};

        // Search by name, email, or company
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
            ];
        }

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by lifecycle stage
        if (lifecycleStage) {
            query.lifecycleStage = lifecycleStage;
        }

        // Filter by assigned employee
        if (assignedTo) {
            query.assignedTo = assignedTo;
        }

        // Filter by client
        if (client) {
            query.client = client;
        }

        // Role-based filtering
        const roleSlug = typeof req.user.role === 'object' ? req.user.role?.slug : req.user.role;
        
        if (roleSlug === 'employee' || roleSlug === 'sales_employee' || 
            roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
            roleSlug === 'operations_employee' || roleSlug === 'management_employee') {
            // Employees can only see their assigned contacts
            const employee = await Employee.findOne({ user: req.user._id });
            if (employee) {
                query.assignedTo = employee._id;
            }
        }

        // Pagination
        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        // Execute query
        const contacts = await Contact.find(query)
            .populate({
                path: 'assignedTo',
                select: 'employeeId user',
                populate: {
                    path: 'user',
                    select: 'name email'
                }
            })
            .populate('campaign', 'name type')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Get total count
        const totalItems = await Contact.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                contacts,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalItems / limit),
                    totalItems,
                    itemsPerPage: parseInt(limit),
                },
            },
        });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error fetching contacts',
                details: error.message,
            },
        });
    }
};

// @desc    Get contact by ID
// @route   GET /api/contacts/:id
// @access  Private
exports.getContactById = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id)
            .populate({
                path: 'assignedTo',
                select: 'employeeId user department designation',
                populate: {
                    path: 'user',
                    select: 'name email'
                }
            })
            .populate('campaign', 'name type status')
            .populate('convertedFromLead')
            .populate('linkedDeals')
            .populate('linkedTickets')
            .populate('notes.addedBy', 'name email')
            .populate('communicationHistory.addedBy', 'name email')
            .populate('documents.uploadedBy', 'name email');

        if (!contact) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Contact not found',
                },
            });
        }

        // Check permissions
        const roleSlug = typeof req.user.role === 'object' ? req.user.role?.slug : req.user.role;
        
        if (roleSlug === 'employee' || roleSlug === 'sales_employee' || 
            roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
            roleSlug === 'operations_employee' || roleSlug === 'management_employee') {
            const employee = await Employee.findOne({ user: req.user._id });
            if (employee && contact.assignedTo.toString() !== employee._id.toString()) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'You do not have permission to view this contact',
                    },
                });
            }
        }

        res.status(200).json({
            success: true,
            data: contact,
        });
    } catch (error) {
        console.error('Error fetching contact:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error fetching contact',
                details: error.message,
            },
        });
    }
};

// @desc    Create new contact
// @route   POST /api/contacts
// @access  Private
exports.createContact = async (req, res) => {
    try {
        const contactData = {
            ...req.body,
            createdBy: req.user._id,
        };

        const contact = await Contact.create(contactData);

        res.status(201).json({
            success: true,
            message: 'Contact created successfully',
            data: contact,
        });
    } catch (error) {
        console.error('Error creating contact:', error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'DUPLICATE_ENTRY',
                    message: 'Contact with this email already exists',
                },
            });
        }

        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Error creating contact',
                details: error.message,
            },
        });
    }
};

// @desc    Update contact
// @route   PUT /api/contacts/:id
// @access  Private
exports.updateContact = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Contact not found',
                },
            });
        }

        // Check permissions
        const roleSlug = typeof req.user.role === 'object' ? req.user.role?.slug : req.user.role;
        
        if (roleSlug === 'employee' || roleSlug === 'sales_employee' || 
            roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
            roleSlug === 'operations_employee' || roleSlug === 'management_employee') {
            const employee = await Employee.findOne({ user: req.user._id });
            if (employee && contact.assignedTo.toString() !== employee._id.toString()) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'You do not have permission to update this contact',
                    },
                });
            }
        }

        // Update contact
        Object.assign(contact, req.body);
        await contact.save();

        res.status(200).json({
            success: true,
            message: 'Contact updated successfully',
            data: contact,
        });
    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Error updating contact',
                details: error.message,
            },
        });
    }
};

// @desc    Delete contact
// @route   DELETE /api/contacts/:id
// @access  Private (Admin/SuperAdmin)
exports.deleteContact = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Contact not found',
                },
            });
        }

        await contact.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Contact deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error deleting contact',
                details: error.message,
            },
        });
    }
};

// @desc    Convert lead to contact
// @route   POST /api/contacts/convert-lead/:leadId
// @access  Private
exports.convertLeadToContact = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.leadId);

        if (!lead) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Lead not found',
                },
            });
        }

        if (lead.status === 'converted') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Lead has already been converted',
                },
            });
        }

        // Split name into first and last name
        const nameParts = lead.name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || firstName;

        // Create contact from lead
        const contactData = {
            firstName,
            lastName,
            email: lead.email,
            phone: lead.phone,
            company: lead.company,
            assignedTo: req.body.assignedTo || lead.assignedTo,
            lifecycleStage: req.body.lifecycleStage || 'sales-qualified',
            source: lead.source,
            campaign: lead.campaign,
            convertedFromLead: lead._id,
            conversionDate: new Date(),
            tags: lead.tags || [],
            createdBy: req.user._id,
        };

        const contact = await Contact.create(contactData);

        // Update lead status
        lead.status = 'converted';
        lead.convertedToContact = contact._id;
        lead.conversionDate = new Date();
        await lead.save();

        // Create deal if requested
        let deal = null;
        if (req.body.createDeal && req.body.dealDetails) {
            deal = await Deal.create({
                ...req.body.dealDetails,
                contact: contact._id,
                assignedTo: contact.assignedTo,
                createdBy: req.user._id,
            });

            // Link deal to contact
            contact.linkedDeals.push(deal._id);
            contact.totalDeals += 1;
            await contact.save();
        }

        res.status(201).json({
            success: true,
            message: 'Lead converted to contact successfully',
            data: {
                contact,
                deal,
            },
        });
    } catch (error) {
        console.error('Error converting lead:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error converting lead to contact',
                details: error.message,
            },
        });
    }
};

// @desc    Add communication to contact
// @route   POST /api/contacts/:id/communication
// @access  Private
exports.addCommunication = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Contact not found',
                },
            });
        }

        const communication = {
            ...req.body,
            addedBy: req.user._id,
            createdAt: new Date(),
        };

        contact.communicationHistory.push(communication);
        contact.lastContactedDate = new Date();
        await contact.save();

        res.status(200).json({
            success: true,
            message: 'Communication added successfully',
            data: contact,
        });
    } catch (error) {
        console.error('Error adding communication:', error);
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Error adding communication',
                details: error.message,
            },
        });
    }
};

// @desc    Add note to contact
// @route   POST /api/contacts/:id/notes
// @access  Private
exports.addNote = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Contact not found',
                },
            });
        }

        const note = {
            content: req.body.content,
            isPinned: req.body.isPinned || false,
            addedBy: req.user._id,
            addedAt: new Date(),
        };

        contact.notes.push(note);
        await contact.save();

        res.status(200).json({
            success: true,
            message: 'Note added successfully',
            data: contact,
        });
    } catch (error) {
        console.error('Error adding note:', error);
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Error adding note',
                details: error.message,
            },
        });
    }
};

// @desc    Get contact timeline (all activities)
// @route   GET /api/contacts/:id/timeline
// @access  Private
exports.getContactTimeline = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id)
            .populate('communicationHistory.addedBy', 'name')
            .populate('notes.addedBy', 'name')
            .populate('linkedDeals')
            .populate('linkedTickets');

        if (!contact) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Contact not found',
                },
            });
        }

        // Combine all timeline events
        const timeline = [
            ...contact.communicationHistory.map(comm => ({
                type: 'communication',
                subType: comm.type,
                date: comm.date || comm.createdAt,
                data: comm,
            })),
            ...contact.notes.map(note => ({
                type: 'note',
                date: note.addedAt,
                data: note,
            })),
            ...contact.linkedDeals.map(deal => ({
                type: 'deal',
                date: deal.createdAt,
                data: deal,
            })),
            ...contact.linkedTickets.map(ticket => ({
                type: 'ticket',
                date: ticket.createdAt,
                data: ticket,
            })),
        ];

        // Sort by date (most recent first)
        timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json({
            success: true,
            data: timeline,
        });
    } catch (error) {
        console.error('Error fetching timeline:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error fetching contact timeline',
                details: error.message,
            },
        });
    }
};
