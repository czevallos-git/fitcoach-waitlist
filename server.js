const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const WAITLIST_FILE = path.join(__dirname, 'waitlist.json');

app.use(express.json());
app.use(express.static(__dirname));

// Load existing waitlist
function loadWaitlist() {
  try {
    if (fs.existsSync(WAITLIST_FILE)) {
      return JSON.parse(fs.readFileSync(WAITLIST_FILE, 'utf-8'));
    }
  } catch (e) { /* ignore */ }
  return [];
}

function saveWaitlist(list) {
  fs.writeFileSync(WAITLIST_FILE, JSON.stringify(list, null, 2));
}

app.post('/api/waitlist', (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required.' });
  }

  const normalized = email.trim().toLowerCase();
  const waitlist = loadWaitlist();

  if (waitlist.find(e => e.email === normalized)) {
    return res.status(200).json({ ok: true, message: 'Already on the list!' });
  }

  waitlist.push({
    email: normalized,
    joinedAt: new Date().toISOString()
  });

  saveWaitlist(waitlist);
  console.log(`New signup: ${normalized} (total: ${waitlist.length})`);
  res.status(200).json({ ok: true, count: waitlist.length });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', waitlistCount: loadWaitlist().length });
});

// Fall back to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`FitCoach AI waitlist running on port ${PORT}`);
});
