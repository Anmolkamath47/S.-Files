# Files App - Setup & Usage

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- npm

### Installation

```bash
npm install
```

### Running the App

The app requires **two** processes to run:

#### 1. Start the Backend API Server
```bash
npm run server
```
This starts the Express server on `http://localhost:3000` that handles photo storage and sync.

#### 2. Start the Frontend Dev Server (in a new terminal)
```bash
npm run dev
```
This starts the Vite dev server on `http://localhost:5173` with hot module reloading.

#### Production Build
```bash
npm run build
```

---

## 🌍 Cross-Device Synchronization

### How It Works

1. **Backend Storage**: All photos are stored in the Express server's memory (in `server.js`)
2. **Real-time Sync**: When a user uploads a photo from any device, it's sent to the API server
3. **Instant Retrieval**: Any user on any device can immediately see newly uploaded photos

### Architecture

```
Device 1 (Browser)
      ↓
   [React App]
      ↓
   [HTTP Request]
      ↓
   [Express Server]  ←→  [Photo Storage]
      ↑
   [HTTP Response]
      ↓
Device 2 (Browser)
      ↓
   [React App]
```

### Features

- ✅ **Multi-User Support**: Each browser gets a unique user ID
- ✅ **Custom Usernames**: Users can edit their display name
- ✅ **User Filtering**: View all photos or filter by specific user
- ✅ **Auto-sync Polling**: App polls for new photos every 8 seconds
- ✅ **Photo Metadata**: Each photo stores uploader name, timestamp, and ID
- ✅ **Responsive Design**: Works on desktop and mobile devices

### Testing Cross-Device Sync

1. Open `http://localhost:5173` in one browser/device
2. Open `http://localhost:5173` in another browser/device (will get different user ID)
3. Upload a photo from Device 1
4. Check Device 2 - the photo should appear instantly in the shared gallery

### API Endpoints

- `GET /api/photos` - Fetch all photos with metadata
- `POST /api/photos` - Upload a new photo
- `DELETE /api/photos/:id` - Delete a photo (optional)
- `GET /health` - Health check

---

## 📝 Notes

- Photos are stored in server memory, so they persist while the server is running
- When the server restarts, all photos are cleared (for production, use a database like MongoDB)
- The app polls every 8 seconds for new photos to keep the gallery in sync
