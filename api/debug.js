const supabase = require('../lib/supabase');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const info = {
    supabaseUrlSet: !!process.env.SUPABASE_URL,
    supabaseKeySet: !!process.env.SUPABASE_ANON_KEY,
  };

  // Test GET count
  try {
    const result = await supabase.from('waitlist').select('*', { count: 'exact', head: true });
    info.getResult = {
      count: result.count,
      status: result.status,
      statusText: result.statusText,
      error: result.error ? JSON.stringify(result.error) : null,
      errorType: typeof result.error,
    };
  } catch (err) {
    info.getError = err.message;
  }

  // Test INSERT with a timestamp email
  const testEmail = `debug-${Date.now()}@fitcoach.ai`;
  try {
    const insertResult = await supabase.from('waitlist').insert({ email: testEmail }).select();
    info.insertResult = {
      status: insertResult.status,
      statusText: insertResult.statusText,
      error: insertResult.error ? JSON.stringify(insertResult.error) : null,
      data: insertResult.data,
    };
  } catch (err) {
    info.insertError = err.message;
  }

  return res.json(info);
};
