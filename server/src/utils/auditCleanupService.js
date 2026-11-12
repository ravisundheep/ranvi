const AuditLog = require('../models/AuditLog');
const SiteSettings = require('../models/SiteSettings');

/**
 * Get configured timezone from SiteSettings or environment fallback
 */
const getTimezone = async () => {
  try {
    const settings = await SiteSettings.findOne({ key: 'global_settings' }).select('timezone');
    if (settings?.timezone) {
      return settings.timezone;
    }
  } catch (err) {
    // Fallback if settings query fails
  }
  return process.env.TIMEZONE || 'Asia/Kolkata';
};

/**
 * Calculates the exact UTC Date object representing 00:00:00.000 in the target timezone
 * @param {string} tz - IANA timezone string (e.g. 'Asia/Kolkata')
 * @param {Date} d - Reference date (defaults to current timestamp)
 * @returns {Date} UTC Date representing start of day in that timezone
 */
const getStartOfDayInTimezone = (tz = 'Asia/Kolkata', d = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(d);

  const y = parseInt(parts.find((p) => p.type === 'year').value, 10);
  const m = parseInt(parts.find((p) => p.type === 'month').value, 10);
  const day = parseInt(parts.find((p) => p.type === 'day').value, 10);

  const targetUtc = Date.UTC(y, m - 1, day, 0, 0, 0, 0);
  const testDate = new Date(targetUtc);

  const localParts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(testDate);

  const lh = parseInt(localParts.find((p) => p.type === 'hour').value, 10) % 24;
  const lm = parseInt(localParts.find((p) => p.type === 'minute').value, 10);
  const ld = parseInt(localParts.find((p) => p.type === 'day').value, 10);

  const diffMinutes = (ld - day) * 24 * 60 + lh * 60 + lm;
  return new Date(targetUtc - diffMinutes * 60000);
};

/**
 * Permanently deletes all security audit log records created before the start of the current day.
 * Ensures strict isolation: NEVER deletes from any other collection or table.
 *
 * @param {Object} options
 * @param {string} [options.timezone]
 * @param {Date} [options.startOfDay]
 * @returns {Promise<{success: boolean, deletedCount: number, startOfDay: Date, timezone: string}>}
 */
const cleanupExpiredAuditLogs = async (options = {}) => {
  try {
    const timezone = options.timezone || (await getTimezone());
    const startOfDay = options.startOfDay || getStartOfDayInTimezone(timezone);

    // Strictly purge ONLY volatile non-immutable AuditLog entries before start-of-day.
    // Financial, Staff/RBAC, Payment, Enrollment, and Suspension logs (isImmutable: true) are preserved permanently.
    const result = await AuditLog.deleteMany({
      createdAt: { $lt: startOfDay },
      isImmutable: { $ne: true },
    });

    if (result.deletedCount > 0) {
      console.log(
        `[AuditLogCleanup] Purged ${result.deletedCount} expired audit log(s) older than ${startOfDay.toISOString()} (Timezone: ${timezone})`
      );
    }

    return {
      success: true,
      deletedCount: result.deletedCount || 0,
      startOfDay,
      timezone,
    };
  } catch (error) {
    console.error('[AuditLogCleanup] Error deleting expired audit logs:', error.message);
    return {
      success: false,
      error: error.message,
      deletedCount: 0,
    };
  }
};

/**
 * Initializes the automated daily scheduled cleanup job
 */
let cleanupIntervalHandle = null;

const initAuditLogCleanupJob = () => {
  // 1. Run initial cleanup on startup
  cleanupExpiredAuditLogs().catch((err) => {
    console.error('[AuditLogCleanup] Startup cleanup error:', err.message);
  });

  // 2. Set hourly heartbeat scheduled job
  if (!cleanupIntervalHandle) {
    cleanupIntervalHandle = setInterval(() => {
      cleanupExpiredAuditLogs().catch((err) => {
        console.error('[AuditLogCleanup] Scheduled cleanup error:', err.message);
      });
    }, 60 * 60 * 1000); // Check and prune hourly

    // Unref so that background timer doesn't prevent graceful Node process shutdown in test scripts
    if (cleanupIntervalHandle.unref) {
      cleanupIntervalHandle.unref();
    }
  }

  console.log('[AuditLogCleanup] Daily scheduled cleanup job initialized (Hourly heartbeat + start-of-day cutoff).');
};

const stopAuditLogCleanupJob = () => {
  if (cleanupIntervalHandle) {
    clearInterval(cleanupIntervalHandle);
    cleanupIntervalHandle = null;
  }
};

module.exports = {
  getTimezone,
  getStartOfDayInTimezone,
  cleanupExpiredAuditLogs,
  initAuditLogCleanupJob,
  stopAuditLogCleanupJob,
};
