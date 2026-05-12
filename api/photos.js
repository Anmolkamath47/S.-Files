// Vercel Serverless Function for photo storage
let photosStore = {
  index: [],
  photos: {}
};

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Return all photos
      const photos = photosStore.index.map(item => ({
        ...item,
        src: photosStore.photos[item.id] || null
      }));
      return res.status(200).json(photos);
    }

    if (req.method === 'POST') {
      const { id, name, ts, userId, username, imageData } = req.body;

      if (!id || !imageData) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      photosStore.photos[id] = imageData;
      photosStore.index.push({
        id,
        name: name || 'Untitled',
        ts: ts || Date.now(),
        userId: userId || 'anonymous',
        username: username || 'Anonymous'
      });

      return res.status(200).json({ success: true, id });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      photosStore.index = photosStore.index.filter(item => item.id !== id);
      delete photosStore.photos[id];
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
