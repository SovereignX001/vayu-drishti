import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');

  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'metrics.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return res.status(200).send(data);
    }

    const fallbackPath = path.join(process.cwd(), 'backend', 'models', 'metrics.json');
    if (fs.existsSync(fallbackPath)) {
      const data = fs.readFileSync(fallbackPath, 'utf8');
      return res.status(200).send(data);
    }

    return res.status(404).json({ error: 'Metrics file not found' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read metrics', message: err.message });
  }
}
