const Notification = require('../models/Notification');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// Student: Get my personal notifications
const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    return sendSuccess(res, 'Notifications retrieved', notifications);
  } catch (error) {
    next(error);
  }
};

// Student: Mark notification as read
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await Notification.updateMany({ recipientId: req.user._id, isRead: false }, { isRead: true });
    } else {
      await Notification.findOneAndUpdate({ _id: id, recipientId: req.user._id }, { isRead: true });
    }
    return sendSuccess(res, 'Notifications updated');
  } catch (error) {
    next(error);
  }
};

// Public: Get all active, published institutional notifications
const getPublicNotifications = async (req, res) => {
  try {
    const { type, search, page = 1, limit = 20 } = req.query;
    const now = new Date();

    const query = {
      isPublic: true,
      status: 'PUBLISHED',
      $or: [
        { expiresAt: null },
        { expiresAt: { $exists: false } },
        { expiresAt: { $gte: now } },
      ],
    };

    if (type && type !== 'ALL') {
      query.type = type;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { description: regex }, { message: regex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ isPinned: -1, displayOrder: 1, publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Notification.countDocuments(query),
    ]);

    return sendSuccess(res, 'Public notifications retrieved', {
      notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error('Error fetching public notifications:', error);
    return sendError(res, 'Failed to fetch notifications', 500);
  }
};

// Public: Get single public notification by ID
const getPublicNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({ _id: id, isPublic: true }).lean();
    if (!notification) {
      return sendError(res, 'Notification not found', 404);
    }
    return sendSuccess(res, 'Notification retrieved', notification);
  } catch (error) {
    console.error('Error fetching notification:', error);
    return sendError(res, 'Failed to fetch notification', 500);
  }
};

// Admin: Get all notifications (published, draft, expired, inactive)
const getAdminNotifications = async (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 20 } = req.query;
    const query = { isPublic: true };

    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (type && type !== 'ALL') {
      query.type = type;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { description: regex }, { message: regex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ isPinned: -1, displayOrder: 1, publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Notification.countDocuments(query),
    ]);

    return sendSuccess(res, 'Admin notifications retrieved', {
      notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    return sendError(res, 'Failed to fetch admin notifications', 500);
  }
};

// Admin: Create public notification
const createAdminNotification = async (req, res) => {
  try {
    const {
      title,
      description,
      message,
      type = 'ANNOUNCEMENT',
      link,
      attachment,
      status = 'PUBLISHED',
      isPinned = false,
      publishedAt,
      expiresAt,
      displayOrder = 0,
    } = req.body;

    if (!title || !title.trim()) {
      return sendError(res, 'Notification title is required', 400);
    }

    const notification = await Notification.create({
      recipientId: null,
      isPublic: true,
      title: title.trim(),
      description: description ? description.trim() : (message ? message.trim() : ''),
      message: message ? message.trim() : (description ? description.trim() : ''),
      type,
      link: link ? link.trim() : '',
      attachment: attachment ? attachment.trim() : '',
      status: ['PUBLISHED', 'DRAFT', 'INACTIVE'].includes(status) ? status : 'PUBLISHED',
      isPinned: Boolean(isPinned),
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      displayOrder: typeof displayOrder === 'number' ? displayOrder : 0,
    });

    return sendSuccess(res, 'Notification created successfully', notification, 201);
  } catch (error) {
    console.error('Error creating notification:', error);
    return sendError(res, error.message || 'Failed to create notification', 500);
  }
};

// Admin: Update public notification
const updateAdminNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      message,
      type,
      link,
      attachment,
      status,
      isPinned,
      publishedAt,
      expiresAt,
      displayOrder,
    } = req.body;

    const notification = await Notification.findOne({ _id: id, isPublic: true });
    if (!notification) {
      return sendError(res, 'Notification not found', 404);
    }

    if (title !== undefined) notification.title = title.trim();
    if (description !== undefined) notification.description = description.trim();
    if (message !== undefined) notification.message = message.trim();
    if (type !== undefined) notification.type = type;
    if (link !== undefined) notification.link = link ? link.trim() : '';
    if (attachment !== undefined) notification.attachment = attachment ? attachment.trim() : '';
    if (status !== undefined) notification.status = status;
    if (isPinned !== undefined) notification.isPinned = Boolean(isPinned);
    if (publishedAt !== undefined) notification.publishedAt = new Date(publishedAt);
    if (expiresAt !== undefined) notification.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (displayOrder !== undefined) notification.displayOrder = Number(displayOrder);

    await notification.save();

    return sendSuccess(res, 'Notification updated successfully', notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    return sendError(res, error.message || 'Failed to update notification', 500);
  }
};

// Admin: Delete notification
const deleteAdminNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndDelete({ _id: id, isPublic: true });
    if (!notification) {
      return sendError(res, 'Notification not found', 404);
    }
    return sendSuccess(res, 'Notification permanently deleted', { id });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return sendError(res, 'Failed to delete notification', 500);
  }
};

// Admin: Toggle notification status
const toggleNotificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({ _id: id, isPublic: true });
    if (!notification) {
      return sendError(res, 'Notification not found', 404);
    }

    notification.status = notification.status === 'PUBLISHED' ? 'INACTIVE' : 'PUBLISHED';
    await notification.save();

    return sendSuccess(res, `Notification status set to ${notification.status}`, notification);
  } catch (error) {
    console.error('Error toggling notification status:', error);
    return sendError(res, 'Failed to toggle status', 500);
  }
};

// Admin: Toggle notification pinned
const toggleNotificationPinned = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({ _id: id, isPublic: true });
    if (!notification) {
      return sendError(res, 'Notification not found', 404);
    }

    notification.isPinned = !notification.isPinned;
    await notification.save();

    return sendSuccess(res, `Notification ${notification.isPinned ? 'pinned' : 'unpinned'}`, notification);
  } catch (error) {
    console.error('Error toggling notification pinned:', error);
    return sendError(res, 'Failed to toggle pin', 500);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  getPublicNotifications,
  getPublicNotificationById,
  getAdminNotifications,
  createAdminNotification,
  updateAdminNotification,
  deleteAdminNotification,
  toggleNotificationStatus,
  toggleNotificationPinned,
};
