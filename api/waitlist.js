const fs = require('fs');
const path = require('path');

const WAITLIST_FILE = path.join('/tmp', 'waitlist.json');

function loadWaitlist() {
  try {
    if (fs.existsSync(WAITLIST_FILE)) {
      return JSON.parse(fs.readFileSync(WAITLIST_FILE, 'utf-8'));
    }
  } catch (e) {}
  return [];
}

function saveWaitlist(list) {
  fs.writeFileSync(WAITLIST_FILE, JSON.stringify(list, null, 2));
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET' && req.url.startsWith('/api/health')) {
    return res.json({ status: 'ok', waitlistCount: loadWaitlist().length });
  }

  if (req.method === 'POST' && req.url.startsWith('/api/waitlist')) {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required.' });
    }
    const normalized = email.trim().toLowerCase();
    const waitlist = loadWaitlist();
    if (waitlist.find(e => e.email === normalized)) {
      return res.status(200).json({ ok: true, message: 'Already on the list!' });
    }
    waitlist.push({ email: normalized, joinedAt: new Date().toISOString() });
    saveWaitlist(waitlist);
    console.log(`New signup: ${normalized} (total: ${waitlist.length})`);
    return res.status(200).json({ ok: true, count: waitlist.length });
  }

  return res.status(404).json({ error: 'Not found' });
};
