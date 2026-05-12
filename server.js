import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// In-memory storage for photos and metadata
const photosStore = {
  index: [], // Array of {id, name, ts, userId, username}
  photos: {} // Map of id -> base64 image data
};

// GET /api/photos - Retrieve all photos with metadata
app.get("/api/photos", (req, res) => {
  try {
    const photos = photosStore.index.map(item => ({
      ...item,
      src: photosStore.photos[item.id] || null
    }));
    console.log(`[GET] Returning ${photos.length} photos`);
    res.json(photos);
  } catch (error) {
    console.error("[GET] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/photos - Upload a new photo
app.post("/api/photos", (req, res) => {
  try {
    const { id, name, ts, userId, username, imageData } = req.body;
    
    console.log(`[UPLOAD] Received: id=${id}, size=${imageData?.length || 0} bytes`);
    
    if (!id || !imageData) {
      console.log(`[UPLOAD] Failed: Missing required fields`);
      return res.status(400).json({ error: "Missing required fields (id, imageData)" });
    }

    if (imageData.length > 10 * 1024 * 1024) {
      console.log(`[UPLOAD] Failed: Image too large (${imageData.length} bytes)`);
      return res.status(413).json({ error: "Image data too large (max 10MB)" });
    }

    // Store photo data
    photosStore.photos[id] = imageData;
    
    // Store metadata
    photosStore.index.push({
      id,
      name: name || "Untitled",
      ts: ts || Date.now(),
      userId: userId || "anonymous",
      username: username || "Anonymous"
    });

    console.log(`[UPLOAD] Success: ${id} uploaded by ${username}`);
    res.json({ success: true, id });
  } catch (error) {
    console.error("[UPLOAD] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/photos/:id - Delete a photo
app.delete("/api/photos/:id", (req, res) => {
  try {
    const { id } = req.params;
    
    // Remove from index
    photosStore.index = photosStore.index.filter(item => item.id !== id);
    
    // Remove photo data
    delete photosStore.photos[id];

    console.log(`[DELETE] Photo ${id} deleted`);
    res.json({ success: true });
  } catch (error) {
    console.error("[DELETE] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", photosCount: photosStore.index.length });
});

app.listen(PORT, () => {
  console.log(`🖼  Photo server running on http://localhost:${PORT}`);
  console.log(`📸 API: http://localhost:${PORT}/api/photos`);
});
