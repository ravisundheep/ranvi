const Enquiry = require('../models/Enquiry');
const Notification = require('../models/Notification');
const env = require('../config/env');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { emitNewEnquiryReceived, emitAdminStatsUpdate } = require('../utils/socketService');
const { sendNotificationEmail } = require('../utils/emailService');

// Helper to generate unique request ID e.g. REQ-2026-10492
const generateRequestId = async () => {
  const year = new Date().getFullYear();
  for (let i = 0; i < 5; i++) {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const candidateId = `REQ-${year}-${randomNum}`;
    const exists = await Enquiry.exists({ requestId: candidateId });
    if (!exists) return candidateId;
  }
  return `REQ-${year}-${Date.now().toString().slice(-5)}`;
};

// Public/Student: Submit enquiry, demo booking, career guidance, or support ticket
const createEnquiry = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone,
      whatsappNumber,
      requestACall,
      qualification,
      careerGoals,
      division,
      courseInterest,
      type,
      priority,
      preferredMode,
      preferredSchedule,
      message,
    } = req.body;

    if (!fullName || !email || !phone) {
      return sendError(res, 'Please provide your name, email, and mobile number', 400);
    }

    // Phone validation (Flexible 10-digit Indian standard)
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      return sendError(res, 'Please enter a valid 10-digit mobile number', 400);
    }

    const requestId = await generateRequestId();
    const studentId = req.user ? req.user._id : null;

    const enquiry = await Enquiry.create({
      requestId,
      studentId,
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: cleanPhone,
      whatsappNumber: whatsappNumber ? whatsappNumber.replace(/[^0-9]/g, '') : '',
      requestACall: Boolean(requestACall),
      qualification: qualification ? qualification.trim() : '',
      careerGoals: careerGoals ? careerGoals.trim() : '',
      division: division || 'GENERAL',
      courseInterest: courseInterest || 'General Enquiry',
      type: type || 'GENERAL',
      priority: priority || 'MEDIUM',
      preferredMode: preferredMode || 'BOTH',
      preferredSchedule: preferredSchedule || 'Flexible',
      message: message ? message.trim() : '',
      status: 'PENDING',
    });

    emitNewEnquiryReceived(enquiry);
    emitAdminStatsUpdate({ reason: 'NEW_ENQUIRY' });

    return sendSuccess(res, 'Thank you! Your request has been recorded. Our counselor/support team will assist you shortly.', enquiry, 201);
  } catch (error) {
    next(error);
  }
};

// Student: Get my guidance & support requests
const getMyRequests = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email ? req.user.email.toLowerCase() : '';
    const userPhone = req.user.phone ? req.user.phone.replace(/[^0-9]/g, '') : '';

    const query = {
      $or: [
        { studentId: userId },
        ...(userEmail ? [{ email: userEmail }] : []),
        ...(userPhone ? [{ phone: userPhone }] : []),
      ],
    };

    const requests = await Enquiry.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, 'My requests and guidance history retrieved', requests);
  } catch (error) {
    next(error);
  }
};

// Admin: Get enquiries with filtering and pagination
const getEnquiries = async (req, res, next) => {
  try {
    const { status, type, division, priority, page = 1, limit = 20, search } = req.query;
    const query = {};

    if (status && status !== 'ALL') query.status = status;
    if (type && type !== 'ALL') query.type = type;
    if (division && division !== 'ALL') query.division = division;
    if (priority && priority !== 'ALL') query.priority = priority;
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { requestId: searchRegex },
        { fullName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { courseInterest: searchRegex },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Enquiry.countDocuments(query);
    const enquiries = await Enquiry.find(query)
      .populate('assignedTo', 'name email role')
      .populate('resolvedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    return sendSuccess(res, 'Enquiries retrieved', {
      enquiries,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin/Staff: Assign request to Faculty or Counselor
const assignEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedTo, assignedRole } = req.body;

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return sendError(res, 'Enquiry not found', 404);
    }

    if (assignedTo) enquiry.assignedTo = assignedTo;
    if (assignedRole) enquiry.assignedRole = assignedRole;
    enquiry.status = 'IN_PROGRESS';

    enquiry.adminNotes.push({
      note: `Assigned to ${assignedRole || 'Faculty/Counsellor'} by ${req.user.name || req.user.email}`,
      addedBy: req.user.name || req.user.email,
      addedAt: new Date(),
    });

    await enquiry.save();
    return sendSuccess(res, 'Request assigned successfully', enquiry);
  } catch (error) {
    next(error);
  }
};

// Admin: Update enquiry status, resolution, & add note
const updateEnquiryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note, resolutionNote } = req.body;

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return sendError(res, 'Enquiry not found', 404);
    }

    if (status) enquiry.status = status;
    if (resolutionNote) {
      enquiry.resolutionNote = resolutionNote.trim();
      enquiry.resolvedAt = new Date();
      enquiry.resolvedBy = req.user._id;
    }
    if (note) {
      enquiry.adminNotes.push({
        note: note.trim(),
        addedBy: req.user.name || req.user.email,
        addedAt: new Date(),
      });
    }

    await enquiry.save();

    if (resolutionNote || ['ANSWERED', 'CLOSED', 'RESOLVED'].includes(enquiry.status)) {
      try {
        if (enquiry.studentId) {
          await Notification.create({
            recipientId: enquiry.studentId,
            isPublic: false,
            title: `Update on Request ${enquiry.requestId || ''}: ${enquiry.status}`,
            message: resolutionNote
              ? resolutionNote.trim()
              : `Your support/guidance request status has been updated to ${enquiry.status}.`,
            type: 'SYSTEM',
            link: '/student/profile',
            status: 'PUBLISHED',
          });
        }

        if (enquiry.email) {
          sendNotificationEmail({
            to: enquiry.email,
            subject: `Ranvi Institutions — Update on Your Request (${enquiry.requestId || enquiry.status})`,
            title: 'Support & Guidance Update',
            message: `Hello ${enquiry.name},\n\nYour request (${enquiry.requestId || 'Support Ticket'}) status is now: ${enquiry.status}.\n${
              resolutionNote ? `\nFaculty / Counsellor Resolution:\n${resolutionNote.trim()}` : ''
            }`,
            actionUrl: `${env.CLIENT_ORIGIN}/student/profile`,
            actionLabel: 'View Request History',
          });
        }
      } catch (notifyErr) {
        console.error('Non-blocking enquiry notification error:', notifyErr);
      }
    }

    return sendSuccess(res, 'Enquiry updated successfully', enquiry);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEnquiry,
  getMyRequests,
  getEnquiries,
  assignEnquiry,
  updateEnquiryStatus,
};
