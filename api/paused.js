export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.status(200).json({ status: 'paused', message: 'Project is currently paused to save quota.' });
}
