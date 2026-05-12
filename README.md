# 📸 Files App - Shared Photo Gallery

A modern, real-time shared photo gallery application where users can upload and view photos from any device. Photos uploaded by one user are instantly visible to all other users across different devices.

## ✨ Features

- 🌍 **Cross-Device Sync**: Upload photos on one device and see them immediately on any other device
- 👥 **Multi-User Support**: Each user gets a unique ID and can customize their display name
- 🎨 **Beautiful UI**: Dark theme with responsive grid layout
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- 🚀 **Real-time Updates**: Gallery auto-refreshes every 8 seconds
- 🖼️ **Smart Compression**: Photos are automatically compressed to optimize storage
- 🔍 **User Filtering**: Browse all photos or filter by specific users

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- npm

### Installation

```bash
npm install
```

### Running the App

Start the backend server in one terminal:
```bash
npm run server
```

Start the frontend in another terminal:
```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## 🔄 Cross-Device Workflow

1. **Device A** (User: John)
   - Opens the app → gets unique user ID
   - Uploads a photo

2. **Device B** (User: Sarah)
   - Opens the app → gets different unique user ID
   - Gallery auto-syncs and shows John's photo

3. **Device C** (User: Mike)
   - Opens the app → gets another unique user ID
   - Can see all photos from John & Sarah
   - Can filter by user or view all

## 🛠️ Technology Stack

- **Frontend**: React 19 + Vite + CSS
- **Backend**: Express.js
- **Storage**: In-memory (can be extended to MongoDB/PostgreSQL)
- **Communication**: HTTP REST API

## 📚 For Detailed Setup Instructions

See [SETUP.md](./SETUP.md) for comprehensive documentation including API endpoints and advanced configuration.

## 📝 Project Structure

```
.
├── src/
│   ├── App.jsx           # Main React component
│   ├── main.jsx          # React entry point
│   ├── App.css           # Styles
│   └── index.css         # Global styles
├── server.js             # Express backend server
├── package.json          # Dependencies
├── vite.config.js        # Vite configuration
└── README.md             # This file
```

## 🎯 How It Works

### Upload Flow
1. User selects image from device
2. Image is compressed locally
3. Compressed image + metadata sent to API server
4. Server stores photo in memory
5. All connected clients receive update notification

### Sync Flow
1. App polls `/api/photos` every 8 seconds
2. Fetches latest photos with user info
3. Updates gallery in real-time

## 🚢 Production Deployment

For production use:
- Replace in-memory storage with a database (MongoDB, PostgreSQL)
- Add authentication (JWT tokens)
- Deploy backend to cloud (Heroku, AWS, Railway)
- Deploy frontend to CDN (Netlify, Vercel)

## 📄 License

MIT
