const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'SUPPORT_STAFF', 'FINANCE_STAFF'];

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  FACULTY: 'Faculty',
  SUPPORT_STAFF: 'Support Staff',
  FINANCE_STAFF: 'Finance Staff',
  STUDENT: 'Student',
};

const hasStaffRole = (role) => STAFF_ROLES.includes(role);

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before role authorization.',
      });
    }

    if (req.user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact administration.',
      });
    }

    // SUPER_ADMIN has access to all admin/staff endpoints
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted. Requires one of [${allowedRoles.join(', ')}] permissions.`,
      });
    }

    next();
  };
};

module.exports = { authorize, STAFF_ROLES, ROLE_LABELS, hasStaffRole };
