// Vercel Serverless Function for photo storage with MongoDB
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'filesapp';
const COLLECTION_NAME = 'photos';

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

async function getPhotosCollection() {
  const client = await connectToDatabase();
  const db = client.db(DB_NAME);
  return db.collection(COLLECTION_NAME);
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const collection = await getPhotosCollection();
      const photos = await collection
        .find({})
        .sort({ ts: -1 })
        .toArray();
      
      return res.status(200).json(photos);
    }

    if (req.method === 'POST') {
      const { id, name, ts, userId, username, imageData } = req.body;

      if (!id || !imageData) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const collection = await getPhotosCollection();
      await collection.updateOne(
        { id },
        {
          $set: {
            id,
            name: name || 'Untitled',
            ts: ts || Date.now(),
            userId: userId || 'anonymous',
            username: username || 'Anonymous',
            src: imageData
          }
        },
        { upsert: true }
      );

      return res.status(200).json({ success: true, id });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      const collection = await getPhotosCollection();
      await collection.deleteOne({ id });
      
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

