const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../../uploads');
const videoDir = path.join(uploadDir, 'videos');
const imageDir = path.join(uploadDir, 'images');
const papersDir = path.join(uploadDir, 'papers');

[uploadDir, videoDir, imageDir, papersDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, videoDir);
    } else if (
      file.mimetype === 'application/pdf' ||
      file.mimetype.includes('csv') ||
      file.mimetype.includes('json') ||
      file.mimetype.includes('document') ||
      file.mimetype.includes('sheet') ||
      file.originalname.match(/\.(pdf|csv|json|doc|docx|xlsx|xls)$/i)
    ) {
      cb(null, papersDir);
    } else {
      cb(null, imageDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase() || (file.mimetype.startsWith('video/') ? '.mp4' : '.jpg');
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/') ||
    file.mimetype === 'application/pdf' ||
    file.mimetype.includes('csv') ||
    file.mimetype.includes('json') ||
    file.mimetype.includes('document') ||
    file.mimetype.includes('sheet') ||
    file.originalname.match(/\.(pdf|csv|json|doc|docx|xlsx|xls)$/i)
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only images, videos (MP4/WebM), PDFs, and document files (CSV/JSON/DOCX) are allowed!'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB max limit
  },
  fileFilter,
});

exports.uploadMiddleware = upload;

const getFullUrl = (req, relativePath) => {
  const host = req.get('host');
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  return `${protocol}://${host}${relativePath}`;
};

// Read leading magic bytes from saved file for binary signature validation
const readHeaderBytes = (filePath, length = 32) => {
  const fd = fs.openSync(filePath, 'r');
  try {
    const buffer = Buffer.alloc(length);
    const bytesRead = fs.readSync(fd, buffer, 0, length, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    fs.closeSync(fd);
  }
};

const cleanupRejectedFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn('[UploadCleanup] Failed removing invalid file:', err.message);
  }
};

const hasExecutableMagicBytes = (buf) => {
  if (!buf || buf.length < 2) return false;
  // Windows PE ("MZ"), ELF ("\x7fELF"), Mach-O, Shebang ("#!")
  if (buf[0] === 0x4d && buf[1] === 0x5a) return true;
  if (buf.length >= 4 && buf[0] === 0x7f && buf[1] === 0x45 && buf[2] === 0x4c && buf[3] === 0x46) return true;
  if (buf[0] === 0x23 && buf[1] === 0x21) return true;
  return false;
};

const verifyMagicBytes = (filePath, kind, ext = '') => {
  const buf = readHeaderBytes(filePath, 64);
  if (!buf || buf.length < 2 || hasExecutableMagicBytes(buf)) return false;

  if (kind === 'IMAGE') {
    const isPng = buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    const isJpg = buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    const isGif = buf.length >= 4 && buf.subarray(0, 4).toString('ascii') === 'GIF8';
    const isWebp = buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
    return isPng || isJpg || isGif || isWebp;
  }

  if (kind === 'VIDEO') {
    const isMp4 = buf.length >= 8 && buf.subarray(4, 8).toString('ascii') === 'ftyp';
    const isWebmOrMkv = buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3;
    const isAvi = buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 11).toString('ascii') === 'AVI';
    const isOgg = buf.length >= 4 && buf.subarray(0, 4).toString('ascii') === 'OggS';
    return isMp4 || isWebmOrMkv || isAvi || isOgg;
  }

  if (kind === 'DOCUMENT') {
    const cleanExt = ext.toLowerCase();
    const isPdf = buf.length >= 4 && buf.subarray(0, 4).toString('ascii') === '%PDF';
    const isZipOffice = buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && (buf[2] === 0x03 || buf[2] === 0x05);
    const isOleOffice = buf.length >= 4 && buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0;

    if (cleanExt === '.pdf') return isPdf;
    if (cleanExt === '.docx' || cleanExt === '.xlsx') return isZipOffice;
    if (cleanExt === '.doc' || cleanExt === '.xls') return isOleOffice;
    if (cleanExt === '.csv' || cleanExt === '.json') {
      // Disallow NUL bytes or HTML/script tags in header
      if (buf.includes(0x00)) return false;
      const headText = buf.toString('utf8').toLowerCase();
      if (headText.includes('<script') || headText.includes('<!doctype html')) return false;
      return true;
    }
    return isPdf || isZipOffice || isOleOffice;
  }

  return false;
};

// Image upload handler (disallows SVG to prevent XSS)
exports.handleImageUpload = (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No image file provided', 400);
    }
    if (!verifyMagicBytes(req.file.path, 'IMAGE')) {
      cleanupRejectedFile(req.file.path);
      return sendError(res, 'Invalid image signature. Only genuine PNG, JPG, GIF, or WebP files are permitted.', 400);
    }
    const relativePath = `/uploads/images/${req.file.filename}`;
    const fullUrl = getFullUrl(req, relativePath);
    return sendSuccess(res, {
      url: fullUrl,
      relativePath,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    }, 'Image uploaded successfully');
  } catch (err) {
    cleanupRejectedFile(req.file?.path);
    next(err);
  }
};

// Video upload handler
exports.handleVideoUpload = (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No video file provided', 400);
    }
    if (!verifyMagicBytes(req.file.path, 'VIDEO')) {
      cleanupRejectedFile(req.file.path);
      return sendError(res, 'Invalid video file header. Only genuine MP4, WebM, AVI, or OGG videos are permitted.', 400);
    }
    const relativePath = `/uploads/videos/${req.file.filename}`;
    const fullUrl = getFullUrl(req, relativePath);
    return sendSuccess(res, {
      url: fullUrl,
      relativePath,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      provider: 'CUSTOM',
    }, 'Video uploaded successfully');
  } catch (err) {
    cleanupRejectedFile(req.file?.path);
    next(err);
  }
};

// Document / Mock Test Paper PDF upload handler
exports.handleDocumentUpload = (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No document or paper file provided', 400);
    }
    const ext = path.extname(req.file.originalname || req.file.filename || '');
    if (!verifyMagicBytes(req.file.path, 'DOCUMENT', ext)) {
      cleanupRejectedFile(req.file.path);
      return sendError(res, 'Uploaded document content does not match an allowed format (PDF/CSV/JSON/Office).', 400);
    }
    const relativePath = `/uploads/papers/${req.file.filename}`;
    const fullUrl = getFullUrl(req, relativePath);
    return sendSuccess(res, {
      url: fullUrl,
      relativePath,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    }, 'Mock test paper / document uploaded successfully');
  } catch (err) {
    cleanupRejectedFile(req.file?.path);
    next(err);
  }
};

