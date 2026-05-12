/**
 * Authenticates server-to-server calls (e.g. WhatsApp AI bridge).
 * Send header: X-API-Key: <CLIENT_SECRET>
 */
function integrationAuth(req, res, next) {
  const expected = process.env.CLIENT_SECRET;
  if (!expected) {
    return res.status(503).json({ error: 'Integration API is not configured (missing CLIENT_SECRET)' });
  }
  const provided = req.headers['x-api-key'];
  if (!provided || provided !== expected) {
    return res.status(401).json({ error: 'Invalid or missing X-API-Key header' });
  }
  next();
}

module.exports = integrationAuth;
