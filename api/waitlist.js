// In-memory store (persists within warm lambda, resets on cold start)
// For production: use Vercel KV or Supabase
const waitlist = [];

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET /api/health or /api/waitlist
  if (req.method === 'GET') {
    return res.json({ status: 'ok', waitlistCount: waitlist.length });
  }

  // POST /api/waitlist
  if (req.method === 'POST') {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required.' });
    }
    const normalized = email.trim().toLowerCase();
    if (waitlist.find(e => e.email === normalized)) {
      return res.status(200).json({ ok: true, message: 'Already on the list!' });
    }
    waitlist.push({ email: normalized, joinedAt: new Date().toISOString() });
    console.log(`New signup: ${normalized} (total: ${waitlist.length})`);
    return res.status(200).json({ ok: true, count: waitlist.length });
  }

  return res.status(404).json({ error: 'Not found' });
};
