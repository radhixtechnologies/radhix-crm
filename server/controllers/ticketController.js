const Ticket = require('../models/Ticket');
const Contact = require('../models/Contact');
const User = require('../models/User');
const { createNotification } = require('../utils/notification');

// @desc    Get all tickets with filtering and pagination
// @route   GET /api/tickets
// @access  Private
exports.getAllTickets = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            status,
            priority,
            category,
            assignedTo,
            contact,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = req.query;

        const query = {};

        // Search
        if (search) {
            query.subject = { $regex: search, $options: 'i' };
        }

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by priority
        if (priority) {
            query.priority = priority;
        }

        // Filter by category
        if (category) {
            query.category = category;
        }

        // Filter by assignedTo
        if (assignedTo) {
            query.assignedTo = assignedTo;
        }

        // Filter by contact
        if (contact) {
            query.contact = contact;
        }

        // Role-based access control for non-admins
        if (req.user.role === 'employee' && !req.user.permissions?.includes('view_all_tickets')) {
            // Employees typically see tickets assigned to them or their team, or if they are support agents
            // For simplicity, if they aren't admin, let's assume they see tickets assigned to them OR they see all if they are support staff.
            // We'll stick to a simpler model: if assignedTo is not specified, show all (assuming open system) or restrict.
            // Let's restricting to assignedTo = current user IF they are not admin/support lead.
            // However, often support agents need to pick from a queue.
            // query.$or = [{ assignedTo: req.user.employeeId }, { assignedTo: null }]; // Example logic
        }

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const tickets = await Ticket.find(query)
            .populate('contact', 'firstName lastName email company')
            .populate('assignedTo', 'user employeeId designation')
            .populate('assignedTo.user', 'name')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const totalItems = await Ticket.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                tickets,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalItems / limit),
                    totalItems,
                    itemsPerPage: parseInt(limit),
                },
            },
        });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error fetching tickets',
            },
        });
    }
};

// @desc    Get ticket by ID
// @route   GET /api/tickets/:id
// @access  Private
exports.getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('contact', 'firstName lastName email phone company')
            .populate('assignedTo', 'user employeeId')
            .populate('messages.sentBy', 'name email role')
            .populate('createdBy', 'name');

        if (!ticket) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Ticket not found',
                },
            });
        }

        res.status(200).json({
            success: true,
            data: ticket,
        });
    } catch (error) {
        console.error('Error fetching ticket:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error fetching ticket',
            },
        });
    }
};

// @desc    Create new ticket
// @route   POST /api/tickets
// @access  Private
exports.createTicket = async (req, res) => {
    try {
        const { contact, subject, description, priority, category, type } = req.body;

        console.log('📥 Received ticket creation request:', { contact, subject, description, priority, category, type });
        console.log('👤 User:', req.user?._id, req.user?.name);

        // Validate required fields
        if (!contact) {
            console.log('❌ Validation failed: Contact is required');
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Contact is required',
                    details: 'Please select a customer/contact for this ticket',
                },
            });
        }

        if (!subject || !description) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Missing required fields',
                    details: 'Subject and description are required',
                },
            });
        }

        // Verify contact exists
        console.log('🔍 Checking if contact exists:', contact);
        const contactExists = await Contact.findById(contact);
        if (!contactExists) {
            console.log('❌ Contact not found:', contact);
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid contact',
                    details: 'The selected contact does not exist',
                },
            });
        }

        console.log('✅ Contact found:', contactExists.firstName, contactExists.lastName);

        const ticketData = {
            contact,
            subject,
            description,
            priority,
            category,
            type,
            createdBy: req.user._id,
            status: 'new', // Default status
        };

        console.log('💾 Creating ticket with data:', ticketData);
        const ticket = await Ticket.create(ticketData);
        console.log('✅ Ticket created successfully:', ticket._id);

        // Notify admins about new ticket (wrapped in try-catch to prevent blocking)
        try {
            console.log('📢 Sending notifications to admins...');
            const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } });
            console.log(`Found ${admins.length} admins to notify`);

            for (const admin of admins) {
                await createNotification(
                    admin._id,
                    'info',
                    'New Ticket Created',
                    `Ticket #${ticket._id} created by ${req.user.name}: ${subject}`,
                    `/support/tickets/${ticket._id}`
                );
            }
            console.log('✅ Notifications sent');
        } catch (notificationError) {
            console.error('⚠️ Failed to send notifications (non-critical):', notificationError.message);
            // Don't fail the request if notifications fail
        }

        res.status(201).json({
            success: true,
            message: 'Ticket created successfully',
            data: ticket,
        });
    } catch (error) {
        console.error('❌ Error creating ticket:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Validation failed',
                    details: messages.join(', '),
                },
            });
        }

        // Handle cast errors (invalid ObjectId)
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid data format',
                    details: `Invalid ${error.path}: ${error.value}`,
                },
            });
        }

        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Error creating ticket',
                details: error.message,
            },
        });
    }
};

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private
exports.updateTicket = async (req, res) => {
    try {
        const updates = req.body;

        // Check if status is changing to resolved/closed to set timestamps
        if (updates.status === 'resolved' || updates.status === 'closed') {
            if (!updates.resolution) updates.resolution = {};
            updates.resolution.resolvedAt = new Date();
            updates.resolution.resolvedBy = req.user._id;
            updates.closedAt = new Date();
        }

        const ticket = await Ticket.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!ticket) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Ticket not found',
                },
            });
        }

        res.status(200).json({
            success: true,
            message: 'Ticket updated successfully',
            data: ticket,
        });
    } catch (error) {
        console.error('Error updating ticket:', error);
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Error updating ticket',
                details: error.message,
            },
        });
    }
};

// @desc    Add message to ticket thread
// @route   POST /api/tickets/:id/messages
// @access  Private
exports.addMessage = async (req, res) => {
    try {
        const { content, isInternal, attachments } = req.body;

        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        const newMessage = {
            messageType: isInternal ? 'internal' : 'agent',
            content,
            attachments,
            sentBy: req.user._id,
            isInternal: isInternal || false,
            sentAt: new Date()
        };

        ticket.messages.push(newMessage);

        // SLA: Update first response timestamp if not set and message is not internal
        if (!isInternal && !ticket.sla.firstResponseAt) {
            ticket.sla.firstResponseAt = new Date();
        }

        // Auto-update status to 'open' or 'waiting-customer' if purely replying
        if (ticket.status === 'new') {
            ticket.status = 'open';
        }

        await ticket.save();

        // Notify relevant parties
        const messageAuthorId = req.user._id.toString();

        // If sent by agent/admin, notify ticket creator (customer/employee)
        // Assuming ticket.contact is not a User object but a Contact model. 
        // If ticket.createdBy is a User, notify them.
        if (ticket.createdBy && ticket.createdBy.toString() !== messageAuthorId) {
            await createNotification(
                ticket.createdBy,
                'info',
                'New Reply on Ticket',
                `New reply on ticket #${ticket.ticketNumber || ticket._id}: ${content.substring(0, 50)}...`,
                `/support/tickets/${ticket._id}`
            );
        }

        // If sent by creator, notify assigned agent
        if (ticket.assignedTo && ticket.assignedTo.user && ticket.assignedTo.user.toString() !== messageAuthorId) {
            await createNotification(
                ticket.assignedTo.user,
                'info',
                'New Reply on Ticket',
                `New reply on ticket #${ticket.ticketNumber || ticket._id}: ${content.substring(0, 50)}...`,
                `/support/tickets/${ticket._id}`
            );
        }

        res.status(201).json({
            success: true,
            data: ticket.messages[ticket.messages.length - 1]
        });

    } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).json({ success: false, message: 'Error adding message' });
    }
};

// @desc    Delete ticket
// @route   DELETE /api/tickets/:id
// @access  Private (Admin only)
exports.deleteTicket = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'Not authorized' },
            });
        }

        const ticket = await Ticket.findByIdAndDelete(req.params.id);

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        res.status(200).json({ success: true, message: 'Ticket deleted successfully' });
    } catch (error) {
        console.error('Error deleting ticket:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get ticket metrics (SLA, Volume)
// @route   GET /api/tickets/metrics/overview
// @access  Private
exports.getTicketMetrics = async (req, res) => {
    try {
        const totalTickets = await Ticket.countDocuments();
        const openTickets = await Ticket.countDocuments({ status: { $in: ['new', 'open', 'in-progress'] } });
        const resolvedTickets = await Ticket.countDocuments({ status: { $in: ['resolved', 'closed'] } });
        const slaBreached = await Ticket.countDocuments({
            $or: [{ 'sla.isFirstResponseBreached': true }, { 'sla.isResolutionBreached': true }]
        });

        res.status(200).json({
            success: true,
            data: {
                totalTickets,
                openTickets,
                resolvedTickets,
                slaBreached,
                resolutionRate: totalTickets ? ((resolvedTickets / totalTickets) * 100).toFixed(1) : 0
            }
        });
    } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
