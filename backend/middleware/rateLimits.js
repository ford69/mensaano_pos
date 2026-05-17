const rateLimit = require('express-rate-limit');

function intEnv(name, fallback) {
  const v = parseInt(process.env[name], 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

/** Brute-force protection: only failed attempts count toward cap when skipSuccessfulRequests is true */
const authLoginLimiter = rateLimit({
  windowMs: intEnv('RATE_LIMIT_LOGIN_WINDOW_MS', 15 * 60 * 1000),
  max: intEnv('RATE_LIMIT_LOGIN_MAX', 30),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Too many login attempts. Try again later.' },
});

/** Limit account creation spam */
const authRegisterLimiter = rateLimit({
  windowMs: intEnv('RATE_LIMIT_REGISTER_WINDOW_MS', 60 * 60 * 1000),
  max: intEnv('RATE_LIMIT_REGISTER_MAX', 15),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration attempts. Try again later.' },
});

/** Integration / third-party (menu + orders) */
const integrationLimiter = rateLimit({
  windowMs: intEnv('RATE_LIMIT_INTEGRATION_WINDOW_MS', 60 * 1000),
  max: intEnv('RATE_LIMIT_INTEGRATION_MAX', 120),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many integration requests. Try again later.' },
});

module.exports = {
  authLoginLimiter,
  authRegisterLimiter,
  integrationLimiter,
};
