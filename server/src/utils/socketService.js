const { Server } = require('socket.io');
const { verifyAccessToken } = require('./jwt');
const env = require('../config/env');

let io = null;

const allowedOrigins = Array.from(
  new Set([
    ...(env.ALLOWED_ORIGINS || []),
    ...(env.NODE_ENV !== 'production'
      ? ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']
      : []),
  ])
);

const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'SUPPORT_STAFF', 'FINANCE_STAFF'];

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/+$/, '');
        const isAllowed =
          allowedOrigins.includes(cleanOrigin) ||
          (env.ALLOW_VERCEL_PREVIEWS && cleanOrigin.endsWith('.vercel.app')) ||
          env.NODE_ENV !== 'production';

        if (isAllowed) {
          callback(null, true);
        } else {
          callback(new Error(`Socket CORS rejected origin: ${origin}`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (token) {
        const decoded = verifyAccessToken(token);
        if (decoded) {
          socket.user = decoded;
        }
      }
    } catch (err) {
      // Allow unauthenticated connection for public broadcasts
    }
    next();
  });

  io.on('connection', (socket) => {
    // Always join public broadcast room
    socket.join('broadcast');

    if (socket.user) {
      socket.join('authenticated');
      const role = socket.user.role;
      const userId = socket.user.id || socket.user._id;

      if (role === 'STUDENT' && userId) {
        socket.join(`student:${userId}`);
      }

      if (['SUPER_ADMIN', 'ADMIN'].includes(role)) {
        socket.join('admin');
      }
      if (STAFF_ROLES.includes(role)) {
        socket.join(`staff:${role}`);
      }
    }

    // Explicit room registration from client (enforced identity ownership)
    socket.on('register_student', (studentId) => {
      const authedUserId = socket.user && (socket.user.id || socket.user._id);
      if (
        studentId &&
        authedUserId &&
        String(authedUserId) === String(studentId)
      ) {
        socket.join(`student:${authedUserId}`);
      }
    });

    socket.on('register_admin', () => {
      if (socket.user && ['SUPER_ADMIN', 'ADMIN'].includes(socket.user.role)) {
        socket.join('admin');
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
};

const getIO = () => io;

// Real-Time Event Dispatchers (Graceful no-op if io is not initialized)

const broadcastCourseUpdate = (action, course) => {
  if (!io) return;
  io.to('broadcast').emit('courses:updated', {
    action,
    course,
    timestamp: new Date().toISOString(),
  });
  // Also notify admin room of stats changes
  io.to('admin').emit('admin:stats_updated', {
    reason: 'COURSE_CHANGED',
    timestamp: new Date().toISOString(),
  });
};

const broadcastLiveClassUpdate = (action, liveClass) => {
  if (!io) return;
  io.to('broadcast').emit('live_classes:updated', {
    action,
    liveClass,
    timestamp: new Date().toISOString(),
  });
};

const broadcastMockTestUpdate = (action, mockTest) => {
  if (!io) return;
  io.to('broadcast').emit('mock_tests:updated', {
    action,
    mockTest,
    timestamp: new Date().toISOString(),
  });
};

const emitStudentUpdate = (studentId, updateType, data = {}) => {
  if (!io || !studentId) return;
  const sId = studentId.toString();
  io.to(`student:${sId}`).emit('student:updated', {
    studentId: sId,
    updateType,
    data,
    timestamp: new Date().toISOString(),
  });
  io.to('admin').emit('admin:student_updated', {
    studentId: sId,
    updateType,
    data,
    timestamp: new Date().toISOString(),
  });
};

const emitEnrollmentChange = (studentId, data = {}) => {
  if (!io || !studentId) return;
  const sId = studentId.toString();
  io.to(`student:${sId}`).emit('enrollment:changed', {
    studentId: sId,
    data,
    timestamp: new Date().toISOString(),
  });
  io.to('admin').emit('admin:stats_updated', {
    reason: 'ENROLLMENT_CHANGED',
    studentId: sId,
    timestamp: new Date().toISOString(),
  });
};

const emitDeviceRevocation = (studentId, reason = 'Session revoked') => {
  if (!io || !studentId) return;
  const sId = studentId.toString();
  io.to(`student:${sId}`).emit('device:revoked', {
    studentId: sId,
    reason,
    timestamp: new Date().toISOString(),
  });
};

const emitAdminStatsUpdate = (data = {}) => {
  if (!io) return;
  io.to('admin').emit('admin:stats_updated', {
    data,
    timestamp: new Date().toISOString(),
  });
};

const emitNewStudentRegistered = (student) => {
  if (!io) return;
  io.to('admin').emit('student:registered', {
    student,
    timestamp: new Date().toISOString(),
  });
  io.to('admin').emit('admin:stats_updated', {
    reason: 'NEW_STUDENT_REGISTERED',
    timestamp: new Date().toISOString(),
  });
};

const emitNewOrderPlaced = (order) => {
  if (!io) return;
  io.to('admin').emit('order:placed', {
    order,
    timestamp: new Date().toISOString(),
  });
  io.to('admin').emit('admin:stats_updated', {
    reason: 'NEW_ORDER_PLACED',
    timestamp: new Date().toISOString(),
  });
};

const emitNewEnquiryReceived = (enquiry) => {
  if (!io) return;
  io.to('admin').emit('enquiry:received', {
    enquiry,
    timestamp: new Date().toISOString(),
  });
};

const broadcastAnnouncementUpdate = (topAnnouncement) => {
  if (!io) return;
  io.to('broadcast').emit('announcement:updated', {
    topAnnouncement,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  initSocket,
  getIO,
  broadcastCourseUpdate,
  broadcastLiveClassUpdate,
  broadcastMockTestUpdate,
  emitStudentUpdate,
  emitEnrollmentChange,
  emitDeviceRevocation,
  emitAdminStatsUpdate,
  emitNewStudentRegistered,
  emitNewOrderPlaced,
  emitNewEnquiryReceived,
  broadcastAnnouncementUpdate,
};
