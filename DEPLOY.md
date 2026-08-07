# Deployment Guide — Baby Shower Guest Registration

Your app URL will be: **https://you-are-invited.vercel.app**

## Prerequisites

- A GitHub account (free)
- Push this project to a GitHub repository

---

## Step 1: Database (Neon — Free)

1. Go to [neon.tech](https://neon.tech) and sign up (free, no credit card)
2. Create a new project (e.g. "baby-shower")
3. Copy the **connection string** — looks like:
   `postgresql://username:password@ep-cool-name.region.neon.tech/neondb?sslmode=require`
4. Run the migration:
   - In Neon's SQL Editor, paste the contents of `backend/src/db/migrations/001_initial.sql` and run it
5. Run the seed (to create admin user):
   - In Neon's SQL Editor, run:
   ```sql
   INSERT INTO admins (username, password_hash)
   VALUES ('admin', '$2b$10$PASTE_YOUR_HASH_HERE');
   ```
   - Or: set `DATABASE_URL` locally and run `npm run db:seed` from the backend folder

---

## Step 2: Backend (Render — Free)

1. Go to [render.com](https://render.com) and sign up (free)
2. Click "New" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Add Environment Variables:
   - `DATABASE_URL` = your Neon connection string
   - `JWT_SECRET` = any random string (e.g. `my-super-secret-jwt-key-2025`)
   - `RESEND_API_KEY` = your Resend API key (from resend.com dashboard)
   - `RESEND_FROM_EMAIL` = `onboarding@resend.dev`
   - `CORS_ORIGIN` = `https://you-are-invited.vercel.app`
   - `PORT` = `3000`
6. Deploy! You'll get a URL like: `https://you-are-invited-api.onrender.com`

---

## Step 3: Frontend (Vercel — Free)

1. Go to [vercel.com](https://vercel.com) and sign up (free)
2. Click "Add New" → "Project"
3. Import your GitHub repo
4. Configure:
   - **Project Name**: `you-are-invited`
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
5. Add Environment Variable:
   - `VITE_API_URL` = `https://you-are-invited-api.onrender.com/api`
   (Replace with your actual Render URL from Step 2)
6. Deploy!

Your site will be live at: **https://you-are-invited.vercel.app**

---

## Step 4: Keep Backend Awake (UptimeRobot — Free)

Render's free tier sleeps after 15 min of inactivity. To prevent this:

1. Go to [uptimerobot.com](https://uptimerobot.com) and sign up (free)
2. Add a new monitor:
   - **Type**: HTTP(s)
   - **URL**: `https://you-are-invited-api.onrender.com/api/health`
   - **Interval**: 5 minutes
3. This pings your backend every 5 minutes, keeping it awake 24/7

---

## Summary

| Service | URL | Cost |
|---------|-----|------|
| Frontend | https://you-are-invited.vercel.app | Free |
| Backend | https://you-are-invited-api.onrender.com | Free |
| Database | Neon PostgreSQL | Free |
| Email | Resend | Free |
| Keep-alive | UptimeRobot | Free |

---

## Share with Guests

Send this link to your guests:
**https://you-are-invited.vercel.app**

Admin panel:
**https://you-are-invited.vercel.app/admin**
(Login: admin / admin123)

---

## Notes

- The app will stay live indefinitely on free tiers (no expiration)
- Resend free tier: 100 emails/day (plenty for a baby shower)
- Neon free tier: 0.5 GB storage (way more than enough)
- Change admin password after first login for security
