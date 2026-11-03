const LatestUpdate = require('../models/LatestUpdate');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// Public: Get all published updates
const getPublishedUpdates = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const updates = await LatestUpdate.find({ status: 'PUBLISHED' })
      .sort({ isPinned: -1, displayOrder: 1, publishedAt: -1 })
      .limit(limit)
      .lean();

    return sendSuccess(res, 'Published latest updates retrieved', updates);
  } catch (error) {
    console.error('Error fetching latest updates:', error);
    return sendError(res, 'Failed to fetch latest updates', 500);
  }
};

// Public: Get single update by ID
const getUpdateById = async (req, res) => {
  try {
    const { id } = req.params;
    const update = await LatestUpdate.findById(id).lean();
    if (!update) {
      return sendError(res, 'Latest update not found', 404);
    }
    return sendSuccess(res, 'Latest update details retrieved', update);
  } catch (error) {
    console.error('Error fetching update by ID:', error);
    return sendError(res, 'Failed to fetch update', 500);
  }
};

// Admin: Get all updates with search & pagination
const getAdminUpdates = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { description: regex }, { badgeText: regex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [updates, total] = await Promise.all([
      LatestUpdate.find(query)
        .sort({ isPinned: -1, displayOrder: 1, publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      LatestUpdate.countDocuments(query),
    ]);

    return sendSuccess(res, 'Admin updates retrieved', {
      updates,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error('Error fetching admin updates:', error);
    return sendError(res, 'Failed to fetch updates for admin', 500);
  }
};

// Admin: Create an update
const createUpdate = async (req, res) => {
  try {
    const { title, description, link, imageOrAttachment, badgeText, publishedAt, status, displayOrder, isPinned } = req.body;

    if (!title || !title.trim()) {
      return sendError(res, 'Update title is required', 400);
    }
    if (!description || !description.trim()) {
      return sendError(res, 'Update description is required', 400);
    }

    const update = await LatestUpdate.create({
      title: title.trim(),
      description: description.trim(),
      link: link ? link.trim() : '',
      imageOrAttachment: imageOrAttachment || '',
      badgeText: badgeText ? badgeText.trim() : 'Latest Update',
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      status: status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
      displayOrder: typeof displayOrder === 'number' ? displayOrder : 0,
      isPinned: Boolean(isPinned),
    });

    return sendSuccess(res, 'Latest update created successfully', update, 201);
  } catch (error) {
    console.error('Error creating update:', error);
    return sendError(res, error.message || 'Failed to create latest update', 500);
  }
};

// Admin: Update an existing update
const updateUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, link, imageOrAttachment, badgeText, publishedAt, status, displayOrder, isPinned } = req.body;

    const update = await LatestUpdate.findById(id);
    if (!update) {
      return sendError(res, 'Latest update not found', 404);
    }

    if (title !== undefined) update.title = title.trim();
    if (description !== undefined) update.description = description.trim();
    if (link !== undefined) update.link = link ? link.trim() : '';
    if (imageOrAttachment !== undefined) update.imageOrAttachment = imageOrAttachment;
    if (badgeText !== undefined) update.badgeText = badgeText.trim();
    if (publishedAt !== undefined) update.publishedAt = new Date(publishedAt);
    if (status !== undefined) update.status = status;
    if (displayOrder !== undefined) update.displayOrder = Number(displayOrder);
    if (isPinned !== undefined) update.isPinned = Boolean(isPinned);

    await update.save();

    return sendSuccess(res, 'Latest update updated successfully', update);
  } catch (error) {
    console.error('Error updating update:', error);
    return sendError(res, error.message || 'Failed to update latest update', 500);
  }
};

// Admin: Delete an update
const deleteUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const update = await LatestUpdate.findByIdAndDelete(id);
    if (!update) {
      return sendError(res, 'Latest update not found', 404);
    }
    return sendSuccess(res, 'Latest update permanently deleted', { id });
  } catch (error) {
    console.error('Error deleting update:', error);
    return sendError(res, 'Failed to delete latest update', 500);
  }
};

// Admin: Toggle update status (PUBLISHED / DRAFT)
const toggleUpdateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const update = await LatestUpdate.findById(id);
    if (!update) {
      return sendError(res, 'Latest update not found', 404);
    }

    update.status = update.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    await update.save();

    return sendSuccess(res, `Update status set to ${update.status}`, update);
  } catch (error) {
    console.error('Error toggling update status:', error);
    return sendError(res, 'Failed to toggle status', 500);
  }
};

module.exports = {
  getPublishedUpdates,
  getUpdateById,
  getAdminUpdates,
  createUpdate,
  updateUpdate,
  deleteUpdate,
  toggleUpdateStatus,
};
