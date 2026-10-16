const Announcement = require('../models/Announcement');

const roleSlug = (user) => typeof user?.role === 'object' ? user.role?.slug : user?.role;
const isAdmin = (user) => {
  const role = roleSlug(user) || '';
  return role === 'super_admin' || role === 'admin' || role.endsWith('_admin');
};

const sendError = (res, error) => res.status(error.statusCode || 500).json({
  success: false,
  message: error.message || 'Announcement request failed',
});
const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

// GET /api/announcements - List announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const { category, search, department } = req.query;
    const query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (department && department !== 'All') {
      query.$or = [{ department: 'All' }, { department }];
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ title: regex }, { content: regex }];
    }

    const announcements = await Announcement.find(query)
      .populate('author', 'name email avatar')
      .populate('comments.user', 'name email avatar')
      .sort({ pinned: -1, createdAt: -1 })
      .lean();

    // Map like status for requesting user
    const userIdStr = String(req.user._id);
    const mapped = announcements.map((a) => ({
      ...a,
      likesCount: (a.likes || []).length,
      hasLiked: (a.likes || []).some((id) => String(id) === userIdStr),
      commentsCount: (a.comments || []).length,
    }));

    res.json({
      success: true,
      data: mapped,
    });
  } catch (error) {
    sendError(res, error);
  }
};

// POST /api/announcements - Create new announcement (Admin/HR only)
exports.createAnnouncement = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      throw fail('Only administrators or HR managers can broadcast announcements', 403);
    }

    const {
      title,
      content,
      category = 'general',
      priority = 'normal',
      pinned = false,
      department = 'All',
      expiresAt = null,
    } = req.body;

    if (!title || !title.trim()) {
      throw fail('Announcement title is required', 400);
    }
    if (!content || !content.trim()) {
      throw fail('Announcement content is required', 400);
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      content: content.trim(),
      category,
      priority,
      pinned: Boolean(pinned),
      department,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      author: req.user._id,
      likes: [],
      comments: [],
    });

    const populated = await Announcement.findById(announcement._id)
      .populate('author', 'name email avatar')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Announcement broadcasted successfully',
      data: {
        ...populated,
        likesCount: 0,
        hasLiked: false,
        commentsCount: 0,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
};

// POST /api/announcements/:id/like - Toggle like/reaction
exports.toggleLike = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) throw fail('Announcement not found', 404);

    const userId = req.user._id;
    const existingIndex = announcement.likes.findIndex((id) => String(id) === String(userId));

    let liked = false;
    if (existingIndex > -1) {
      announcement.likes.splice(existingIndex, 1);
      liked = false;
    } else {
      announcement.likes.push(userId);
      liked = true;
    }

    await announcement.save();

    res.json({
      success: true,
      liked,
      likesCount: announcement.likes.length,
    });
  } catch (error) {
    sendError(res, error);
  }
};

// POST /api/announcements/:id/comments - Add comment
exports.addComment = async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment || !comment.trim()) {
      throw fail('Comment text cannot be empty', 400);
    }

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) throw fail('Announcement not found', 404);

    announcement.comments.push({
      user: req.user._id,
      comment: comment.trim(),
      createdAt: new Date(),
    });

    await announcement.save();

    const populated = await Announcement.findById(announcement._id)
      .populate('comments.user', 'name email avatar')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Comment posted successfully',
      data: populated.comments,
    });
  } catch (error) {
    sendError(res, error);
  }
};

// DELETE /api/announcements/:id - Delete announcement
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) throw fail('Announcement not found', 404);

    if (!isAdmin(req.user) && String(announcement.author) !== String(req.user._id)) {
      throw fail('Permission denied to delete this announcement', 403);
    }

    await Announcement.findByIdAndDelete(announcement._id);
    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    sendError(res, error);
  }
};

