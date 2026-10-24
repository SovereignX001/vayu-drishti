export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question = '', lat = 28.6139, lon = 77.2090 } = req.body || {};

  return res.status(200).json({
    answer: `[Vayu Drishti AI Assistant]: Monitoring active telemetry at (${Number(lat).toFixed(2)}°, ${Number(lon).toFixed(2)}°). For "${question}", current models advise timing outdoor cardiovascular activities for early dawn or afternoon windows when atmospheric convection aids pollutant dispersion.`
  });
}
