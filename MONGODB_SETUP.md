# MongoDB Setup Guide

This guide will help you set up MongoDB for persistent photo storage on Vercel.

## Why MongoDB?

- **Persistent Storage**: Data survives across serverless function invocations
- **Free Tier**: MongoDB Atlas provides free hosting up to 512MB
- **Easy Integration**: Works seamlessly with Vercel
- **Cross-Device**: All users see the same photos instantly

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click **Sign Up** and create a free account
3. Verify your email

## Step 2: Create a Cluster

1. After login, click **Create** to build a new cluster
2. Select the **Free** tier (M0)
3. Choose your region (pick one closest to your users)
4. Click **Create Cluster** (this takes 1-2 minutes)

## Step 3: Get Connection String

1. In MongoDB Atlas, click **Connect**
2. Select **Drivers** → **Node.js**
3. Copy the connection string that looks like:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/filesapp?retryWrites=true&w=majority
   ```

## Step 4: Configure Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `MONGODB_URI`
   - **Value**: Paste your MongoDB connection string from Step 3
4. Click **Save**

## Step 5: Update Your Code

The code already includes MongoDB support! Just make sure:
- `api/photos.js` exists in your project
- `vercel.json` is configured correctly
- Dependencies include `mongodb` package

## Step 6: Deploy to Vercel

```bash
# Push to GitHub
git add .
git commit -m "Add MongoDB for persistent storage"
git push origin master

# Vercel automatically deploys when you push to GitHub
# If not, manually deploy from Vercel dashboard
```

## Testing

1. Open your Vercel URL in two different browsers (or devices)
2. Upload a photo from Device 1
3. Device 2 should see the photo instantly
4. Check MongoDB Atlas dashboard → Data is stored in the collection

## Troubleshooting

### Photos not persisting?
- Check Vercel Environment Variables are set correctly
- Verify MongoDB connection string is correct
- Check MongoDB Atlas IP whitelist (should allow all IPs)

### "Cannot connect to MongoDB"?
- Verify connection string in `.env` file locally
- Test with local MongoDB: `mongodb://localhost:27017/filesapp`
- Check MongoDB Atlas cluster is running

### Need Help?
- MongoDB Docs: https://docs.mongodb.com/
- Vercel Docs: https://vercel.com/docs
- Feel free to ask!

## MongoDB Atlas Free Tier Limits

- Storage: 512MB
- Connection: Always on
- Backup: Automatic

This is more than enough for a shared photo gallery!
