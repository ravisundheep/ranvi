const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const isPlainObject = (val) =>
  val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date);

const sanitizeValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }
  if (!isPlainObject(value)) {
    return value;
  }

  const sanitized = {};
  for (const [key, val] of Object.entries(value)) {
    if (BLOCKED_KEYS.has(key) || key.startsWith('$') || key.includes('.')) {
      continue;
    }
    sanitized[key] = sanitizeValue(val);
  }
  return sanitized;
};

const sanitizeInput = (req, res, next) => {
  if (req.body && isPlainObject(req.body)) {
    req.body = sanitizeValue(req.body);
  } else if (Array.isArray(req.body)) {
    req.body = sanitizeValue(req.body);
  }

  if (req.query && isPlainObject(req.query)) {
    req.query = sanitizeValue(req.query);
  }

  if (req.params && isPlainObject(req.params)) {
    req.params = sanitizeValue(req.params);
  }

  next();
};

module.exports = { sanitizeInput, sanitizeValue };
