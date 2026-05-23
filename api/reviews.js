const OWNER = 'ParthTK';
const REPO  = 'soraia-website';
const PATH  = 'reviews.json';
const API   = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') return res.status(405).end();

  const token = process.env.GH_TOKEN;

  try {
    const ghRes = await fetch(API, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        ...(token ? { Authorization: `token ${token}` } : {})
      }
    });

    if (!ghRes.ok) return res.status(500).json({ error: 'Could not fetch reviews' });

    const file = await ghRes.json();
    const reviews = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));

    // Strip phone numbers before sending to browser
    const safe = reviews.map(({ phone, ...r }) => r);

    res.status(200).json(safe);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};
