import { getHome, searchAnime, getDetail, getStream } from '../lib/scraper.js';

export default async function handler(req, res) {
  // Setup CORS agar bisa diakses
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action, q, url, page } = req.query;

  try {
    let data;
    switch (action) {
      case 'home':
        data = await getHome(page || 1);
        break;
      case 'search':
        data = await searchAnime(q);
        break;
      case 'detail':
        data = await getDetail(url);
        break;
      case 'stream':
        data = await getStream(url);
        break;
      default:
        return res.status(400).json({ error: 'Action not valid' });
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
