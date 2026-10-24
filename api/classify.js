export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { aqi_value } = req.body || {};
  const aqi = Number(aqi_value ?? 100);

  let status = 'Moderate';
  let confidence = 89.0;
  const probabilities = {
    Good: 2.0,
    Satisfactory: 6.0,
    Moderate: 85.0,
    Poor: 5.0,
    'Very Poor': 1.5,
    Severe: 0.5,
  };

  if (aqi <= 50) {
    status = 'Good';
    confidence = 94.5;
    probabilities.Good = 94.5;
    probabilities.Satisfactory = 5.5;
    probabilities.Moderate = 0;
  } else if (aqi <= 100) {
    status = 'Satisfactory';
    confidence = 91.2;
    probabilities.Satisfactory = 91.2;
    probabilities.Moderate = 8.8;
    probabilities.Good = 0;
  } else if (aqi <= 200) {
    status = 'Moderate';
    confidence = 88.6;
    probabilities.Moderate = 88.6;
    probabilities.Poor = 11.4;
  } else if (aqi <= 300) {
    status = 'Poor';
    confidence = 87.4;
    probabilities.Poor = 87.4;
    probabilities.Moderate = 5.0;
    probabilities.VeryPoor = 7.6;
  } else if (aqi <= 400) {
    status = 'Very Poor';
    confidence = 92.1;
    probabilities['Very Poor'] = 92.1;
    probabilities.Severe = 7.9;
  } else {
    status = 'Severe';
    confidence = 96.8;
    probabilities.Severe = 96.8;
    probabilities['Very Poor'] = 3.2;
  }

  return res.status(200).json({
    status,
    confidence,
    probabilities,
  });
}
