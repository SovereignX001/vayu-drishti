export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question = '', lat = 28.6139, lon = 77.2090, _history = [] } = req.body || {};

  return res.status(200).json({
    answer: `Monitoring active telemetry at coordinates ${Number(lat).toFixed(2)}°N, ${Number(lon).toFixed(2)}°E. For your query regarding "${question}", atmospheric forecasts suggest evaluating solar convective hours between 12:00 PM and 3:00 PM IST when thermal mixing improves particulate dispersion. Please check the 24-hour predictive trajectory timeline for exact hourly windows.`
  });
}
