const supabase = require('../lib/supabase');

/**
 * Waitlist API (Vercel serverless function)
 *
 * POST /api/waitlist  — add an email to the Supabase waitlist table
 * GET  /api/waitlist  — return the current signup count + health check
 *
 * Required env vars:
 *   SUPABASE_URL       — your Supabase project URL (e.g. https://<id>.supabase.co)
 *   SUPABASE_ANON_KEY  — your Supabase project anon/public key
 */

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health check + count
  if (req.method === 'GET') {
    try {
      const { count, error } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Supabase count error:', error);
        return res.status(500).json({ error: 'Failed to fetch waitlist count' });
      }

      return res.json({ status: 'ok', waitlistCount: count });
    } catch (err) {
      console.error('GET /api/waitlist error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Signup
  if (req.method === 'POST') {
    const { email } = req.body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required.' });
    }

    const normalized = email.trim().toLowerCase();

    try {
      // Check for existing signup
      const { data: existing } = await supabase
        .from('waitlist')
        .select('email')
        .eq('email', normalized)
        .maybeSingle();

      if (existing) {
        return res.status(200).json({ ok: true, message: 'Already on the list!' });
      }

      // Insert new signup
      const { error: insertError } = await supabase
        .from('waitlist')
        .insert({ email: normalized });

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        // Duplicate key conflict is possible if two requests race
        if (insertError.code === '23505') {
          return res.status(200).json({ ok: true, message: 'Already on the list!' });
        }
        return res.status(500).json({ error: 'Failed to save signup' });
      }

      // Get updated count
      const { count } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true });

      console.log(`New signup: ${normalized} (total: ${count})`);
      return res.status(200).json({ ok: true, count: count || 1 });
    } catch (err) {
      console.error('POST /api/waitlist error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(404).json({ error: 'Not found' });
};
