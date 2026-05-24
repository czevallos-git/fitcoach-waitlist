const express = require('express');
const path = require('path');
const supabase = require('./lib/supabase');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// POST /api/waitlist — add email signup
app.post('/api/waitlist', async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required.' });
  }

  const normalized = email.trim().toLowerCase();

  try {
    const { data: existing } = await supabase
      .from('waitlist')
      .select('email')
      .eq('email', normalized)
      .maybeSingle();

    if (existing) {
      return res.status(200).json({ ok: true, message: 'Already on the list!' });
    }

    const { error: insertError } = await supabase
      .from('waitlist')
      .insert({ email: normalized });

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      if (insertError.code === '23505') {
        return res.status(200).json({ ok: true, message: 'Already on the list!' });
      }
      return res.status(500).json({ error: 'Failed to save signup' });
    }

    const { count } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    console.log(`New signup: ${normalized} (total: ${count})`);
    res.status(200).json({ ok: true, count: count || 1 });
  } catch (err) {
    console.error('POST /api/waitlist error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/health — health check + waitlist count
app.get('/api/health', async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Supabase count error:', error);
      return res.json({ status: 'ok', waitlistCount: 0, note: 'Supabase unavailable' });
    }

    res.json({ status: 'ok', waitlistCount: count });
  } catch (err) {
    console.error('Health check error:', err);
    res.json({ status: 'ok', waitlistCount: 0, note: 'Supabase unavailable' });
  }
});

// Fall back to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`FitCoach AI waitlist running on port ${PORT}`);
});
