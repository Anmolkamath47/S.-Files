# Files App - Setup & Usage

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- npm
- **MongoDB** (for persistent storage - see [MONGODB_SETUP.md](./MONGODB_SETUP.md))

### Installation

```bash
npm install
```

### For Local Development

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

### For Production (Vercel Deployment)

1. **Set up MongoDB Atlas** (see [MONGODB_SETUP.md](./MONGODB_SETUP.md))
2. **Add Environment Variable** in Vercel Dashboard:
   - `MONGODB_URI`: Your MongoDB connection string
3. **Deploy to Vercel** (automatically deployed when you push to GitHub)

#### Production Build
```bash
npm run build
```

---

## 🌍 Cross-Device Synchronization

### How It Works (Local)

1. **Backend Storage**: All photos stored in Express server memory
2. **Real-time Sync**: When user uploads photo, sent to API server
3. **Instant Retrieval**: Any user on any device sees new photos

### How It Works (Vercel/Production)

1. **Serverless API**: Vercel hosts the API at `/api/photos`
2. **MongoDB Storage**: Photos persisted in MongoDB Atlas
3. **Automatic Sync**: Photos sync across all devices instantly

### Architecture (Production)

```
Device 1 (User A)          Device 2 (User B)          Device 3 (User C)
      ↓                           ↓                           ↓
   [React App]              [React App]              [React App]
      ↓                           ↓                           ↓
   [HTTP Request]           [HTTP Request]           [HTTP Request]
      ↓                           ↓                           ↓
      └───────────────────────────┴───────────────────────────┘
                      ↓
             [Vercel API Endpoint]
                      ↓
            [MongoDB Database]
```

### Features

- ✅ **Multi-User Support**: Each browser gets a unique user ID
- ✅ **Custom Usernames**: Users can edit their display name
- ✅ **User Filtering**: View all photos or filter by specific user
- ✅ **Auto-sync Polling**: App polls for new photos every 8 seconds
- ✅ **Photo Metadata**: Each photo stores uploader name, timestamp, and ID
- ✅ **Responsive Design**: Works on desktop and mobile devices
- ✅ **Persistent Storage**: Photos survive server restarts (with MongoDB)

### Testing Cross-Device Sync

#### Locally:
1. Open `http://localhost:5173` in one browser/device
2. Open `http://localhost:5173` in another browser/device (different user ID)
3. Upload a photo from Device 1
4. Device 2 shows photo instantly

#### On Vercel:
1. Deploy to Vercel with MongoDB configured
2. Open your Vercel URL from two different devices
3. Upload from one device
4. Other devices see photo immediately

### API Endpoints

- `GET /api/photos` - Fetch all photos with metadata
- `POST /api/photos` - Upload a new photo
- `DELETE /api/photos/:id` - Delete a photo
- `GET /health` - Health check (local only)

---

## 🗄️ Database Options

### For Local Development
- MongoDB locally: `mongodb://localhost:27017/filesapp`
- Express in-memory: Limited to single server instance

### For Production (Recommended)
- **MongoDB Atlas** (Free tier: 512MB): See [MONGODB_SETUP.md](./MONGODB_SETUP.md)
- Alternative: PostgreSQL, Firebase, or other persistent storage

---

## 📝 Notes

- Local: Photos persist only while server is running
- Production: Photos persist indefinitely in MongoDB
- The app polls every 8 seconds for new photos to keep gallery in sync

