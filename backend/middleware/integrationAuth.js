/**
 * Authenticates server-to-server calls (e.g. WhatsApp AI bridge).
 * Send header: X-API-Key: <INTEGRATION_API_KEY>
 */
function integrationAuth(req, res, next) {
  const expected = process.env.INTEGRATION_API_KEY;
  if (!expected) {
    return res.status(503).json({ error: 'Integration API is not configured (missing INTEGRATION_API_KEY)' });
  }
  const provided = req.headers['x-api-key'];
  if (!provided || provided !== expected) {
    return res.status(401).json({ error: 'Invalid or missing X-API-Key header' });
  }
  next();
}

module.exports = integrationAuth;
