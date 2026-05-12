# Upload Troubleshooting & Testing

## ✅ Verified Working Components

### Backend API (Port 3000)
- ✅ GET `/api/photos` - Returns photos list
- ✅ POST `/api/photos` - Accepts and stores photos
- ✅ CORS headers enabled
- ✅ Handles large image data (up to 50MB)

### Frontend (Port 5173)
- ✅ React app loads successfully
- ✅ Connects to backend API on localhost
- ✅ Auto-detects environment (localhost vs Vercel)
- ✅ Improved error logging in console

## 🐛 If Upload Still Fails

### Check These:

1. **Both servers running?**
   ```bash
   # Terminal 1
   npm run server
   
   # Terminal 2
   npm run dev
   ```

2. **Check browser console** for errors:
   - Press `F12` or `Ctrl+Shift+I`
   - Go to "Console" tab
   - Look for red error messages
   - Check "Network" tab to see failed requests

3. **Check backend logs** for upload errors:
   - Watch terminal where `npm run server` is running
   - Should see `[UPLOAD] Received: id=...`
   - Should see `[UPLOAD] Success:` after upload

4. **Image size issues?**
   - App compresses images automatically
   - Max 8MB file size
   - After compression, max 50MB data allowed

5. **Network blocked?**
   - Firewall might block localhost:3000
   - Try accessing http://localhost:3000/api/photos in browser
   - Should return `[]` (empty array)

## 🧪 Manual Upload Test

If you want to test the API manually:

```powershell
$body = '{"id":"test_1","name":"Test","ts":123456,"userId":"user1","username":"User","imageData":"data:image/png;base64,iVBORw0KGg..."}'
Invoke-WebRequest -Uri "http://localhost:3000/api/photos" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
```

## 📊 Expected API Response

**GET /api/photos**
```json
[
  {
    "id": "1234567890_abc12",
    "name": "My Photo",
    "ts": 1234567890,
    "userId": "user_abc12",
    "username": "John",
    "src": "data:image/png;base64,iVBORw0KGgo..."
  }
]
```

**POST /api/photos**
```json
{
  "success": true,
  "id": "1234567890_abc12"
}
```

## 🔧 Recent Fixes Applied

- ✅ Added comprehensive error logging to backend
- ✅ Improved error messages in frontend
- ✅ Fixed API endpoint detection for localhost
- ✅ Added request size validation
- ✅ Better CORS handling

## 🚀 Next Steps

1. Refresh browser (Ctrl+Shift+R for hard refresh)
2. Open browser console (F12)
3. Try uploading a small image
4. Watch console and backend logs for output
5. Report any error messages you see
