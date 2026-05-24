const supabase = require('../lib/supabase');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const info = {
    supabaseUrl: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.slice(0, 30)}...` : 'NOT SET',
    supabaseKey: process.env.SUPABASE_ANON_KEY ? `${process.env.SUPABASE_ANON_KEY.slice(0, 15)}...` : 'NOT SET',
  };

  try {
    const { data, error, count } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    info.queryResult = error ? { error: error.message, code: error.code, details: error.details } : { count, dataPreview: 'ok' };
  } catch (err) {
    info.queryError = err.message;
  }

  return res.json(info);
};
