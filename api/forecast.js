export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');

  const lat = parseFloat(req.query.lat ?? 28.6139);
  const lon = parseFloat(req.query.lon ?? 77.2090);

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=us_aqi,pm2_5,pm10&forecast_days=2&timezone=Asia%2FKolkata`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo responded with status ${response.status}`);
    }
    const data = await response.json();
    const hourly = data?.hourly;
    if (!hourly || !Array.isArray(hourly.time)) {
      throw new Error('Invalid Open-Meteo response structure');
    }

    const now = new Date();
    const nowIso = now.toISOString().slice(0, 13);
    let currentIdx = hourly.time.findIndex((t) => t.startsWith(nowIso));

    if (currentIdx === -1) {
      const nowMs = now.getTime();
      let minDiff = Infinity;
      hourly.time.forEach((t, i) => {
        const diff = Math.abs(new Date(t).getTime() - nowMs);
        if (diff < minDiff) {
          minDiff = diff;
          currentIdx = i;
        }
      });
    }

    if (currentIdx === -1 || currentIdx >= hourly.time.length) {
      currentIdx = 0;
    }

    const currentAqi = Math.round(hourly.us_aqi[currentIdx] ?? 65);
    const hours = [];
    for (let i = 1; i <= 24; i++) {
      const idx = currentIdx + i;
      if (idx < hourly.time.length) {
        hours.push({
          time: hourly.time[idx],
          aqi: Math.max(10, Math.round(hourly.us_aqi[idx] ?? currentAqi)),
          pm25: hourly.pm2_5?.[idx] != null ? Math.round(hourly.pm2_5[idx]) : Math.round(currentAqi * 0.72),
          pm10: hourly.pm10?.[idx] != null ? Math.round(hourly.pm10[idx]) : Math.round(currentAqi * 1.15),
        });
      }
    }

    return res.status(200).json({
      now: {
        time: hourly.time[currentIdx],
        aqi: currentAqi,
      },
      hours,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve forecast', message: err.message });
  }
}
