const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Lesson = require('../models/Lesson');
const MockTest = require('../models/MockTest');
const Entitlement = require('../models/Entitlement');
const Notification = require('../models/Notification');
const { verifyAccessToken, verifyMediaToken, generateMediaToken } = require('../utils/jwt');

const uploadsRoot = path.resolve(__dirname, '../../uploads');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const attachMediaTokenIfLocal = (url, userId = 'public') => {
  if (!url || typeof url !== 'string') return url;
  const match = url.match(/(\/uploads\/(?:videos|papers)\/[^?#]+)/i);
  if (!match) return url;
  const relativePath = match[1];
  const token = generateMediaToken(relativePath, userId);
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}mediaToken=${encodeURIComponent(token)}`;
};

const resolveAuthenticatedUser = async (req) => {
  let token = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.ranvi_access_token) {
    token = req.cookies.ranvi_access_token;
  }
  if (!token) return null;

  const decoded = verifyAccessToken(token);
  if (!decoded) return null;

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) return null;
  return user;
};

const hasActiveEntitlementFor = async (studentId, itemIds) => {
  const validIds = itemIds.filter(Boolean);
  if (validIds.length === 0) return false;
  const entitlement = await Entitlement.findOne({
    studentId,
    itemId: { $in: validIds },
    isActive: true,
    status: { $in: ['ACTIVE', 'ENROLLED'] },
    validUntil: { $gte: new Date() },
  });
  return Boolean(entitlement);
};

const protectMediaUpload = (folder) => async (req, res, next) => {
  try {
    const rawFilename = req.params.filename || '';
    const safeName = path.basename(rawFilename);
    if (!safeName || safeName !== rawFilename) {
      return res.status(403).json({ success: false, message: 'Invalid media path' });
    }

    const folderRoot = path.resolve(uploadsRoot, folder);
    const fullPath = path.resolve(folderRoot, safeName);
    if (!fullPath.startsWith(folderRoot + path.sep)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const relativePath = `/uploads/${folder}/${safeName}`;

    // 1. Check short-lived signed media token (scoped specifically to this file)
    if (req.query.mediaToken) {
      const mediaDecoded = verifyMediaToken(String(req.query.mediaToken));
      if (mediaDecoded && mediaDecoded.relativePath === relativePath) {
        if (!fs.existsSync(fullPath)) {
          return res.status(404).json({ success: false, message: 'Media file not found' });
        }
        return res.sendFile(fullPath);
      }
      return res.status(403).json({ success: false, message: 'Invalid or expired media access token' });
    }

    // 2. Check authenticated user JWT / cookie
    const user = await resolveAuthenticatedUser(req);
    if (user && ['SUPER_ADMIN', 'ADMIN', 'FACULTY'].includes(user.role)) {
      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ success: false, message: 'Media file not found' });
      }
      return res.sendFile(fullPath);
    }

    const filenameRegex = new RegExp(`/${escapeRegex(safeName)}(?:$|[?#])`, 'i');
    let authorized = false;

    if (folder === 'videos') {
      const lesson = await Lesson.findOne({ videoUrl: filenameRegex, isPublished: true });
      if (lesson) {
        if (lesson.isPreview) {
          authorized = true;
        } else if (user) {
          authorized = await hasActiveEntitlementFor(user._id, [lesson.courseId]);
        }
      }
    } else if (folder === 'papers') {
      const publicNotification = await Notification.findOne({
        isPublic: true,
        status: 'PUBLISHED',
        $or: [{ attachment: filenameRegex }, { link: filenameRegex }],
      });
      if (publicNotification) {
        authorized = true;
      }

      if (!authorized) {
        const mockTest = await MockTest.findOne({
          isPublished: true,
          $or: [{ paperPdfUrl: filenameRegex }, { solutionPdfUrl: filenameRegex }],
        });
        if (mockTest) {
          if (mockTest.isDemoFree) {
            authorized = true;
          } else if (user) {
            authorized = await hasActiveEntitlementFor(user._id, [mockTest._id, mockTest.courseId]);
          }
        }
      }

      if (!authorized) {
        const lessonDoc = await Lesson.findOne({ studyMaterialUrl: filenameRegex, isPublished: true });
        if (lessonDoc) {
          if (lessonDoc.isPreview) {
            authorized = true;
          } else if (user) {
            authorized = await hasActiveEntitlementFor(user._id, [lessonDoc.courseId]);
          }
        }
      }
    }

    if (!authorized) {
      return res.status(user ? 403 : 401).json({
        success: false,
        message: user
          ? 'Access denied. Active enrolment or authorization is required to view this resource.'
          : 'Authentication required to access protected educational materials.',
      });
    }

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, message: 'Media file not found' });
    }
    return res.sendFile(fullPath);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  protectMediaUpload,
  attachMediaTokenIfLocal,
};
