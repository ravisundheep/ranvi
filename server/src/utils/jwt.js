const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateAccessToken = (user, sessionToken = '') => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      sessionToken,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '1d' } // short/medium lived access token
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (err) {
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch (err) {
    return null;
  }
};

const generateMediaToken = (relativePath, userId = 'public') => {
  return jwt.sign(
    {
      purpose: 'MEDIA_ACCESS',
      relativePath,
      userId: String(userId),
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '2h' }
  );
};

const verifyMediaToken = (token) => {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    if (!decoded || decoded.purpose !== 'MEDIA_ACCESS') return null;
    return decoded;
  } catch (err) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateMediaToken,
  verifyMediaToken,
};
