const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const User = require('./models/User');
const seedAll = require('../scripts/seed');
const { initAuditLogCleanupJob, stopAuditLogCleanupJob } = require('./utils/auditCleanupService');
const { initSocket } = require('./utils/socketService');

const startServer = async () => {
  try {
    env.validateProductionEnv();
    await connectDB();

    // Initialize daily automated Security Audit Logs cleanup job
    initAuditLogCleanupJob();

    // Check if database needs initial seeding in development
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Server] Database is fresh. Executing automatic initial seed...');
      await seedAll();
    }

    const server = http.createServer(app);
    initSocket(server);

    server.listen(env.PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 RANVI INSTITUTIONS SERVER RUNNING ON PORT ${env.PORT}`);
      console.log(`🌐 Environment: ${env.NODE_ENV}`);
      console.log(`🔗 API Base:    http://localhost:${env.PORT}/api/v1`);
      console.log(`⚡ Real-Time:   Socket.IO Active on port ${env.PORT}`);
      console.log(`=======================================================`);
    });

    const shutdown = () => {
      console.log('Shutting down server gracefully...');
      stopAuditLogCleanupJob();
      server.close(() => {
        console.log('Process terminated.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
