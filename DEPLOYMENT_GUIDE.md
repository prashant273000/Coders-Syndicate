# Deployment Guide: Backend on Render, Frontend on Vercel

This guide explains how to deploy the Coders-Syndicate application with the backend on Render and frontend on Vercel.

## Prerequisites

- GitHub account
- Render account ([render.com](https://render.com))
- Vercel account ([vercel.com](https://vercel.com))
- Your code pushed to GitHub

## Project Structure

```
Coders-Syndicate/
├── auth/
│   └── backend/          # Express.js backend
│       ├── server.js
│       ├── package.json
│       ├── .env
│       └── ...
├── web_frontend/         # React + Vite frontend
│   ├── src/
│   ├── package.json
│   └── .env.production
└── DEPLOYMENT_GUIDE.md
```

---

## 🚀 Part 1: Deploy Backend to Render

### Step 1: Backend Code is Already Updated ✅

The backend has been updated with:
- Dynamic port assignment (`process.env.PORT`)
- Firebase credentials from environment variable support
- Production-ready CORS configuration

### Step 2: Push Changes to GitHub

```bash
git add .
git commit -m "Prepare for Render/Vercel deployment"
git push origin main
```

### Step 3: Create Render Web Service

1. Go to [render.com](https://render.com) and log in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select the `Coders-Syndicate` repository
4. Configure the service:
   - **Name**: `coders-syndicate-backend` (or your choice)
   - **Region**: Choose closest to your users
   - **Root Directory**: `auth/backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free (or paid for better performance)

### Step 4: Add Environment Variables on Render

In the Render dashboard, go to **Environment** tab and add:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Your MongoDB connection string |
| `ELEVENLABS_API_KEY` | Your ElevenLabs API key |
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `FIREBASE_CREDENTIALS` | Your Firebase service account JSON (see below) |
| `FRONTEND_URL` | Your Vercel frontend URL (add after deploying frontend) |

#### How to add FIREBASE_CREDENTIALS:

**Option 1: Minified JSON (Recommended)**
1. Open your local `auth/backend/serviceAccountKey.json` file
2. Minify the JSON to a single line (remove all newlines)
   - You can use an online JSON minifier or run: `cat serviceAccountKey.json | tr -d '\n'`
3. Copy the entire single-line JSON string
4. Paste it as the value for `FIREBASE_CREDENTIALS` in Render

**Option 2: Upload as a file**
Alternatively, you can commit the `serviceAccountKey.json` to your repository (⚠️ **not recommended** for private projects) or use Render's private git service with the file included.

**Important:** The JSON must be valid. The private_key field contains newlines that need to be preserved as `\n` escape sequences in the JSON string.

### Step 5: Deploy

Click **"Create Web Service"** and wait for deployment to complete.

**Note your backend URL** - it will be something like:
```
https://coders-syndicate-backend.onrender.com
```

---

## 🌐 Part 2: Deploy Frontend to Vercel

### Step 1: Update .env.production

Edit `web_frontend/.env.production` and replace `your-backend-url` with your actual Render backend URL:

```env
VITE_API_ORIGIN=https://coders-syndicate-backend.onrender.com
VITE_API_URL=https://coders-syndicate-backend.onrender.com
```

### Step 2: Push Changes to GitHub

```bash
git add .
git commit -m "Update production environment variables"
git push origin main
```

### Step 3: Import Project to Vercel

1. Go to [vercel.com](https://vercel.com) and log in
2. Click **"Add New..."** → **"Project"**
3. Import your `Coders-Syndicate` GitHub repository
4. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `web_frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 4: Add Environment Variables on Vercel

In the Vercel dashboard, go to **Settings** → **Environment Variables** and add:

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_API_ORIGIN` | `https://coders-syndicate-backend.onrender.com` | Production |
| `VITE_API_URL` | `https://coders-syndicate-backend.onrender.com` | Production |

### Step 5: Deploy

Click **"Deploy"** and wait for the build to complete.

**Note your frontend URL** - it will be something like:
```
https://coders-syndicate.vercel.app
```

---

## 🔗 Part 3: Final Configuration

### Update Backend FRONTEND_URL

1. Go back to Render dashboard
2. Add/Update the `FRONTEND_URL` environment variable with your Vercel URL:
   ```
   FRONTEND_URL=https://coders-syndicate.vercel.app
   ```
3. This ensures CORS is properly configured for your production frontend

### Test Your Application

1. Visit your Vercel frontend URL
2. Test all features:
   - Authentication
   - API calls
   - Real-time features (Socket.IO)
   - AI content generation

---

## 📝 Environment Variables Summary

### Backend (Render)
| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Set to `production` |
| `MONGO_URI` | MongoDB connection string |
| `ELEVENLABS_API_KEY` | ElevenLabs API key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `FIREBASE_CREDENTIALS` | Firebase service account JSON |
| `FRONTEND_URL` | Vercel frontend URL |
| `PORT` | Auto-assigned by Render |

### Frontend (Vercel)
| Variable | Description |
|----------|-------------|
| `VITE_API_ORIGIN` | Backend API base URL |
| `VITE_API_URL` | Backend API base URL |

---

## ⚠️ Important Notes

1. **Render Free Tier**: The free tier has a 15-minute idle timeout. The first request after idle will take 30-60 seconds to respond (cold start).

2. **Socket.IO**: For real-time features, ensure your Socket.IO client is configured to connect to the Render backend URL.

3. **API Keys**: Never commit API keys to GitHub. All sensitive data should be stored as environment variables.

4. **CORS**: The backend CORS is configured to allow your Vercel frontend. If you add custom domains, update the `FRONTEND_URL` variable.

5. **Database**: MongoDB Atlas connection is already configured. Ensure your Atlas cluster allows connections from all IPs (0.0.0.0/0) for Render.

---

## 🔄 Updating After Deployment

### Backend Updates
```bash
git push origin main
# Render will automatically redeploy
```

### Frontend Updates
```bash
git push origin main
# Vercel will automatically redeploy
```

---

## 🛠️ Troubleshooting

### Backend Issues
- Check Render logs in the dashboard
- Verify all environment variables are set correctly
- Test API endpoints directly using tools like Postman

### Frontend Issues
- Check Vercel Function logs
- Verify environment variables are set in Vercel
- Clear browser cache and rebuild

### CORS Errors
- Ensure `FRONTEND_URL` is set correctly on Render
- Check that your frontend is using the correct API URLs

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

---

**Deployed successfully? 🎉 Your app is now live!**