const crypto = require('crypto');
const User = require('../models/User');
const DeviceSession = require('../models/DeviceSession');
const AuditLog = require('../models/AuditLog');
const OtpVerification = require('../models/OtpVerification');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { emitNewStudentRegistered } = require('../utils/socketService');
const { isEmailConfigured, sendOtpEmail, sendNotificationEmail } = require('../utils/emailService');
const env = require('../config/env');

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const hashOtpValue = (email, purpose, otp) => {
  return crypto
    .createHmac('sha256', env.JWT_ACCESS_SECRET)
    .update(`${email.toLowerCase().trim()}:${purpose}:${String(otp).trim()}`)
    .digest('hex');
};

const timingSafeHexEqual = (hexA, hexB) => {
  if (!hexA || !hexB || hexA.length !== hexB.length) return false;
  return crypto.timingSafeEqual(Buffer.from(hexA, 'utf8'), Buffer.from(hexB, 'utf8'));
};

const verifyAndConsumeOtp = async ({ email, purpose, otp, verificationToken, consume = false }) => {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  const record = await OtpVerification.findOne({ email: normalizedEmail, purpose });

  if (!record || record.expiresAt < new Date()) {
    return { ok: false, status: 400, message: 'OTP expired or not requested. Please request a new OTP.' };
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    return { ok: false, status: 429, message: 'Too many incorrect OTP attempts. Please request a new OTP.' };
  }

  let matched = false;
  if (verificationToken && record.verified && record.verificationToken) {
    matched = timingSafeHexEqual(String(verificationToken), record.verificationToken);
  } else if (otp) {
    const incomingHash = hashOtpValue(normalizedEmail, purpose, otp);
    matched = timingSafeHexEqual(incomingHash, record.otpHash);
  } else {
    return { ok: false, status: 400, message: 'Please enter the 6-digit verification OTP sent to your email.' };
  }

  if (!matched) {
    record.attempts += 1;
    await record.save();
    const remaining = Math.max(0, MAX_OTP_ATTEMPTS - record.attempts);
    return {
      ok: false,
      status: 400,
      message: remaining > 0
        ? `Invalid OTP. ${remaining} attempt(s) remaining.`
        : 'Maximum OTP attempts exceeded. Please request a new OTP.',
    };
  }

  if (consume) {
    await OtpVerification.deleteOne({ _id: record._id });
  }

  return { ok: true, record };
};

const getOtpStatus = async (req, res) => {
  return sendSuccess(res, 'OTP configuration status', {
    emailOtpEnabled: isEmailConfigured(),
  });
};

const sendOtp = async (req, res, next) => {
  try {
    const { email, purpose = 'REGISTER' } = req.body;
    const normalizedEmail = String(email || '').toLowerCase().trim();

    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return sendError(res, 'Please provide a valid email address.', 400);
    }

    if (!['REGISTER', 'FORGOT_PASSWORD'].includes(purpose)) {
      return sendError(res, 'Invalid OTP purpose.', 400);
    }

    if (!isEmailConfigured()) {
      return sendError(
        res,
        'Email OTP service is not configured yet. Please set SMTP_USER and SMTP_PASS (Gmail App Password) in server environment variables.',
        503
      );
    }

    if (purpose === 'REGISTER') {
      const existingUser = await User.exists({ email: normalizedEmail });
      if (existingUser) {
        return sendError(res, 'An account with this email already exists.', 400);
      }
    } else if (purpose === 'FORGOT_PASSWORD') {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return sendError(res, 'No account found with this email address.', 404);
      }
      if (!user.isActive) {
        return sendError(res, 'Your account is deactivated. Please contact administration.', 403);
      }
    }

    const existingOtp = await OtpVerification.findOne({ email: normalizedEmail, purpose });
    if (existingOtp && existingOtp.lastSentAt && Date.now() - existingOtp.lastSentAt.getTime() < OTP_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((OTP_COOLDOWN_MS - (Date.now() - existingOtp.lastSentAt.getTime())) / 1000);
      return sendError(res, `Please wait ${waitSeconds}s before requesting another OTP.`, 429);
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = hashOtpValue(normalizedEmail, purpose, otp);
    const now = new Date();

    await OtpVerification.findOneAndUpdate(
      { email: normalizedEmail, purpose },
      {
        email: normalizedEmail,
        purpose,
        otpHash,
        attempts: 0,
        verified: false,
        verificationToken: '',
        lastSentAt: now,
        expiresAt: new Date(now.getTime() + OTP_EXPIRY_MS),
      },
      { upsert: true, new: true }
    );

    await sendOtpEmail(normalizedEmail, otp, purpose);

    return sendSuccess(res, `Verification OTP sent to ${normalizedEmail}`, {
      email: normalizedEmail,
      expiresInSeconds: OTP_EXPIRY_MS / 1000,
    });
  } catch (error) {
    if (error.code === 'SMTP_NOT_CONFIGURED') {
      return sendError(res, error.message, 503);
    }
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp, purpose = 'REGISTER' } = req.body;
    if (!email || !otp) {
      return sendError(res, 'Email and 6-digit OTP are required.', 400);
    }

    const check = await verifyAndConsumeOtp({ email, purpose, otp, consume: false });
    if (!check.ok) {
      return sendError(res, check.message, check.status);
    }

    const verificationToken = crypto.randomBytes(24).toString('hex');
    check.record.verified = true;
    check.record.verificationToken = verificationToken;
    await check.record.save();

    return sendSuccess(res, 'Email verified successfully.', {
      verified: true,
      verificationToken,
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, verificationToken, newPassword } = req.body;
    const normalizedEmail = String(email || '').toLowerCase().trim();

    if (!normalizedEmail || !newPassword) {
      return sendError(res, 'Email and new password are required.', 400);
    }
    if (newPassword.length < 6) {
      return sendError(res, 'New password must be at least 6 characters long.', 400);
    }

    const check = await verifyAndConsumeOtp({
      email: normalizedEmail,
      purpose: 'FORGOT_PASSWORD',
      otp,
      verificationToken,
      consume: true,
    });
    if (!check.ok) {
      return sendError(res, check.message, check.status);
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      return sendError(res, 'Account not found.', 404);
    }

    user.passwordHash = await User.hashPassword(newPassword);
    await user.save();

    // Revoke active device sessions after password reset
    await DeviceSession.updateMany(
      { studentId: user._id, isActive: true },
      {
        isActive: false,
        revokedAt: new Date(),
        revokedReason: 'Password reset via Email OTP',
        revokedBy: 'ADMIN_RESET',
      }
    );

    await AuditLog.create({
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: 'PASSWORD_RESET',
      resource: 'User',
      resourceId: user._id.toString(),
      category: 'AUTH',
      isImmutable: true,
      details: { method: 'EMAIL_OTP' },
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    sendNotificationEmail({
      to: user.email,
      subject: 'Ranvi Institutions — Your Password Was Reset',
      title: 'Security Notice',
      message: `Hello ${user.name},\n\nYour Ranvi Institutions portal password was successfully reset. If this was not you, please contact support immediately.`,
      actionUrl: `${env.CLIENT_ORIGIN}/login`,
      actionLabel: 'Login to Portal',
    });

    return sendSuccess(res, 'Password reset successful. You can now log in with your new password.');
  } catch (error) {
    next(error);
  }
};

const setCookieToken = (res, token) => {
  res.cookie('ranvi_access_token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, targetExam, otp, verificationToken } = req.body;

    if (!name || !email || !phone || !password) {
      return sendError(res, 'Please provide name, email, phone number, and password', 400);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(res, 'An account with this email already exists', 400);
    }

    // Verify Email OTP when SMTP email service is active (or OTP is supplied)
    let emailVerified = false;
    if (isEmailConfigured() || otp || verificationToken) {
      const otpCheck = await verifyAndConsumeOtp({
        email,
        purpose: 'REGISTER',
        otp,
        verificationToken,
        consume: true,
      });
      if (!otpCheck.ok) {
        return sendError(res, otpCheck.message, otpCheck.status);
      }
      emailVerified = true;
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: 'STUDENT',
      isVerified: emailVerified,
      targetExam: targetExam || '',
      demoUsage: { recordedClasses: [], mockTests: [] },
    });

    // Create unique Device Session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const deviceId = req.headers['x-device-id'] || crypto.randomBytes(16).toString('hex');
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    const ipAddress = req.ip || req.connection.remoteAddress || '';

    await DeviceSession.create({
      studentId: user._id,
      deviceId,
      sessionToken,
      deviceInfo: req.headers['x-device-info'] || 'Web Browser',
      userAgent,
      ipAddress,
      isActive: true,
    });

    const token = generateAccessToken(user, sessionToken);
    setCookieToken(res, token);

    await AuditLog.create({
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: 'USER_REGISTER',
      resource: 'User',
      resourceId: user._id.toString(),
      details: { email: user.email, name: user.name },
      ipAddress,
      userAgent,
    });

    // Generate unique Student ID: RAN-YYYY-NNNNN
    const year = new Date().getFullYear();
    const studentCount = await User.countDocuments({ role: 'STUDENT' });
    const paddedNum = String(studentCount).padStart(5, '0');
    user.studentId = `RAN-${year}-${paddedNum}`;

    // Generate unique Student Referral Code: RV + 6 alphanumeric
    for (let i = 0; i < 5; i++) {
      const code = 'RV' + crypto.randomBytes(3).toString('hex').toUpperCase();
      const codeExists = await User.exists({ referralCode: code });
      if (!codeExists) {
        user.referralCode = code;
        break;
      }
    }
    if (!user.referralCode) {
      user.referralCode = 'RV' + Date.now().toString(36).toUpperCase().slice(-6);
    }

    // Check if referred by someone
    const { referralCode: inputRefCode } = req.body;
    if (inputRefCode && typeof inputRefCode === 'string') {
      const referrer = await User.findOne({ referralCode: inputRefCode.trim().toUpperCase() });
      if (referrer && referrer._id.toString() !== user._id.toString()) {
        user.referredBy = referrer._id;
      }
    }

    await user.save();

    sendNotificationEmail({
      to: user.email,
      subject: `Welcome to Ranvi Institutions! (Student ID: ${user.studentId})`,
      title: 'Welcome to Student Portal',
      message: `Hello ${user.name},\n\nYour Ranvi Institutions student account is ready!\nStudent ID: ${user.studentId}\nYour Referral Code: ${user.referralCode}\n\nYou can now log in to access demo lectures, mock tests, and live classes.`,
      actionUrl: `${env.CLIENT_ORIGIN}/student/dashboard`,
      actionLabel: 'Open Student Dashboard',
    });

    emitNewStudentRegistered({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,
    });

    return sendSuccess(res, 'Registration successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        targetExam: user.targetExam,
        studentId: user.studentId,
        referralCode: user.referralCode,
        walletBalance: user.walletBalance || 0,
      },
      token,
      sessionToken,
    }, 201);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, deviceInfo } = req.body;

    if (!email || !password) {
      return sendError(res, 'Please provide email and password', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Your account has been deactivated. Please contact administration.', 403);
    }

    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const deviceId = req.headers['x-device-id'] || crypto.randomBytes(16).toString('hex');
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Single-device enforcement for students:
    // Revoke any previous active session for this student and log audit trail
    if (user.role === 'STUDENT') {
      const activeSessions = await DeviceSession.find({ studentId: user._id, isActive: true });
      if (activeSessions.length > 0) {
        await DeviceSession.updateMany(
          { studentId: user._id, isActive: true },
          {
            isActive: false,
            revokedAt: new Date(),
            revokedReason: `Logged in from new device (${deviceInfo || 'Browser'})`,
            revokedBy: 'NEW_DEVICE_LOGIN',
          }
        );
      }

      await DeviceSession.create({
        studentId: user._id,
        deviceId,
        sessionToken,
        deviceInfo: deviceInfo || 'Web Browser',
        userAgent,
        ipAddress,
        isActive: true,
      });
    }

    const token = generateAccessToken(user, sessionToken);
    setCookieToken(res, token);

    await AuditLog.create({
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: 'USER_LOGIN',
      resource: 'User',
      resourceId: user._id.toString(),
      category: 'AUTH',
      isImmutable: true,
      details: { email: user.email, role: user.role },
      ipAddress,
      userAgent,
    });

    return sendSuccess(res, 'Login successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        targetExam: user.targetExam,
        studentId: user.studentId || null,
        referralCode: user.referralCode || null,
        walletBalance: user.walletBalance || 0,
        payoutDetails: user.payoutDetails || {},
      },
      token,
      sessionToken,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    if (req.user && req.sessionToken) {
      await DeviceSession.updateOne(
        { studentId: req.user._id, sessionToken: req.sessionToken },
        {
          isActive: false,
          revokedAt: new Date(),
          revokedReason: 'User initiated logout',
          revokedBy: 'USER_LOGOUT',
        }
      );
    }

    res.clearCookie('ranvi_access_token');
    return sendSuccess(res, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return sendSuccess(res, 'Current user retrieved', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        targetExam: user.targetExam,
        studentId: user.studentId || null,
        referralCode: user.referralCode || null,
        walletBalance: user.walletBalance || 0,
        payoutDetails: user.payoutDetails || {},
        demoUsage: user.demoUsage,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, targetExam, payoutDetails } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (targetExam !== undefined) user.targetExam = targetExam;
    if (payoutDetails && typeof payoutDetails === 'object') {
      user.payoutDetails = {
        ...user.payoutDetails,
        ...payoutDetails,
      };
    }
    await user.save();

    return sendSuccess(res, 'Profile updated successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        targetExam: user.targetExam,
        studentId: user.studentId || null,
        referralCode: user.referralCode || null,
        walletBalance: user.walletBalance || 0,
        payoutDetails: user.payoutDetails || {},
      },
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return sendError(res, 'Please provide current and new passwords', 400);
    }
    if (newPassword.length < 6) {
      return sendError(res, 'New password must be at least 6 characters', 400);
    }

    const user = await User.findById(req.user._id).select('+passwordHash');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return sendError(res, 'Current password is incorrect', 400);
    }

    user.passwordHash = await User.hashPassword(newPassword);
    await user.save();

    return sendSuccess(res, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  getOtpStatus,
  sendOtp,
  verifyOtp,
  resetPassword,
};
