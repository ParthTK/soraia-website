const OWNER = 'ParthTK';
const REPO  = 'soraia-website';
const PATH  = 'reviews.json';
const API   = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.GH_TOKEN;
  if (!token) return res.status(500).json({ error: 'Server configuration error' });

  const { name, phone, rating, highlights, dining_with, review } = req.body || {};

  if (!name || !rating || !review) {
    return res.status(400).json({ error: 'Name, rating, and review are required' });
  }

  // Read current file + SHA
  const getRes = await fetch(API, {
    headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' }
  });
  if (!getRes.ok) return res.status(500).json({ error: 'Could not read reviews' });

  const file = await getRes.json();
  const reviews = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));

  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: String(name).trim().slice(0, 80),
    phone: String(phone || '').trim().slice(0, 20),
    rating: Math.min(5, Math.max(1, parseInt(rating, 10))),
    highlights: Array.isArray(highlights) ? highlights : (highlights ? [highlights] : []),
    dining_with: String(dining_with || '').trim(),
    review: String(review).trim().slice(0, 2000),
    submitted_at: new Date().toISOString()
  };

  reviews.push(entry);

  const putRes = await fetch(API, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `review: ${entry.name} (${entry.rating}★)`,
      content: Buffer.from(JSON.stringify(reviews, null, 2)).toString('base64'),
      sha: file.sha
    })
  });

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    return res.status(500).json({ error: 'Failed to save review', detail: err.message });
  }

  res.status(200).json({ ok: true, id: entry.id });
};
