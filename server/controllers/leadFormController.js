const LeadForm = require('../models/LeadForm');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');

// Protected: List all forms
exports.listForms = async (req, res) => {
  try {
    const forms = await LeadForm.find().sort({ createdAt: -1 });
    res.json({ success: true, data: forms });
  } catch (error) {
    console.error('Error listing lead forms:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch lead forms' });
  }
};

// Protected: Create a lead form
exports.createForm = async (req, res) => {
  try {
    const {
      title,
      industry = 'General',
      source = 'Website Form',
      fields,
      themeColor = '#6366f1',
      submitButtonText = 'Submit Inquiry',
      successMessage = 'Thank you! Our advisor will connect with you shortly.',
      redirectUrl = '',
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'Form title is required' });
    }

    const form = await LeadForm.create({
      title: title.trim(),
      industry,
      source,
      fields: fields || {
        askName: true,
        askEmail: true,
        askPhone: true,
        askBudget: false,
        askMessage: true,
      },
      themeColor,
      submitButtonText,
      successMessage,
      redirectUrl,
      createdBy: req.user?._id,
    });

    res.status(201).json({ success: true, data: form });
  } catch (error) {
    console.error('Error creating lead form:', error);
    res.status(500).json({ success: false, message: 'Failed to create lead form' });
  }
};

// Protected: Delete a lead form
exports.deleteForm = async (req, res) => {
  try {
    const { id } = req.params;
    await LeadForm.findByIdAndDelete(id);
    res.json({ success: true, message: 'Lead form deleted successfully' });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ success: false, message: 'Failed to delete form' });
  }
};

// PUBLIC: Get public form details for embeddable iframe / public link
exports.getPublicForm = async (req, res) => {
  try {
    const { id } = req.params;
    const form = await LeadForm.findById(id).select(
      'title industry source fields themeColor submitButtonText successMessage redirectUrl isActive'
    );

    if (!form || !form.isActive) {
      return res.status(404).json({ success: false, message: 'Form not found or inactive' });
    }

    res.json({ success: true, data: form });
  } catch (error) {
    console.error('Error fetching public form:', error);
    res.status(500).json({ success: false, message: 'Failed to load form' });
  }
};

// PUBLIC: Submit lead from public form
exports.submitPublicForm = async (req, res) => {
  try {
    const { id } = req.params;
    const form = await LeadForm.findById(id);

    if (!form || !form.isActive) {
      return res.status(404).json({ success: false, message: 'Form is no longer accepting inquiries' });
    }

    const { name, email, phone, budget, message, customAnswer } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide your full name' });
    }

    if (!phone?.trim() && !email?.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide either a phone number or email' });
    }

    // Build notes
    const noteLines = [];
    if (message?.trim()) noteLines.push(`Message: ${message.trim()}`);
    if (customAnswer?.trim() && form.fields?.customQuestion) {
      noteLines.push(`${form.fields.customQuestion}: ${customAnswer.trim()}`);
    }

    // Create lead in CRM
    const newLead = await Lead.create({
      name: name.trim(),
      email: email ? email.trim() : undefined,
      phone: phone ? phone.trim() : undefined,
      source: form.source || 'Website Embed Form',
      industry: form.industry || 'General',
      value: budget ? Number(budget) : 0,
      status: 'new',
      notes: noteLines.join('\n'),
      assignedTo: form.assignedTo || undefined,
    });

    // Increment submissions count on form
    form.submissionsCount = (form.submissionsCount || 0) + 1;
    await form.save();

    // Log activity
    try {
      await Activity.create({
        type: 'lead_created',
        title: `Public Web Form Inquiry: ${name}`,
        description: `Lead submitted via form "${form.title}"`,
        relatedTo: {
          entityType: 'Lead',
          entityId: newLead._id,
        },
      });
    } catch {
      // Activity log failure shouldn't fail lead submission
    }

    res.status(201).json({
      success: true,
      message: form.successMessage || 'Thank you! We have received your inquiry.',
      redirectUrl: form.redirectUrl || '',
    });
  } catch (error) {
    console.error('Error submitting public lead form:', error);
    res.status(500).json({ success: false, message: 'Failed to process inquiry submission' });
  }
};

