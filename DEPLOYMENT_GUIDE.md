# 🚀 OSINT Nexus - Step-by-Step Deployment Guide

This guide walks you through deploying your OSINT Nexus app to the internet so anyone can access it. I've made it as simple as possible!

---

## 📋 Quick Overview

Your app consists of:
- **Frontend**: React app (the user interface)
- **Backend**: Express.js server (handles data and logic)
- **Database**: SQLite (stores user data and search history)

We'll deploy all of this together to make it live on the internet.

---

## 🎯 Recommended: Deploy to Railway (Easiest for Beginners)

Railway is the simplest option and takes about 10 minutes.

### Step 1: Create a Railway Account

1. Go to **https://railway.app**
2. Click **"Start Free"**
3. Sign up with GitHub (recommended) or email
4. Verify your email

### Step 2: Prepare Your Project

1. Make sure all your files are in the `/home/ubuntu/osint-app` folder
2. Ensure you have a `package.json` file (you do ✓)
3. Ensure you have a `.env` file (you do ✓)

### Step 3: Upload to Railway

**Option A: Using GitHub (Recommended)**

1. Push your project to GitHub:
   ```bash
   cd /home/ubuntu/osint-app
   git init
   git add .
   git commit -m "Initial commit: OSINT Nexus app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/osint-app.git
   git push -u origin main
   ```

2. In Railway dashboard, click **"Create New Project"**
3. Select **"Deploy from GitHub"**
4. Connect your GitHub account
5. Select the `osint-app` repository
6. Click **"Deploy"**

**Option B: Using CLI (If you prefer command line)**

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Initialize and deploy:
   ```bash
   cd /home/ubuntu/osint-app
   railway init
   railway up
   ```

### Step 4: Configure Environment Variables

1. In Railway dashboard, go to your project
2. Click on the **"Variables"** tab
3. Add these variables:

   | Variable | Value |
   |----------|-------|
   | `PORT` | `5000` |
   | `NODE_ENV` | `production` |
   | `JWT_SECRET` | Generate a random string (use: `openssl rand -base64 32`) |
   | `DATABASE_URL` | `./osint.db` |

4. Click **"Save"**

### Step 5: Deploy

1. Railway should automatically detect Node.js
2. Click **"Deploy"** button
3. Wait for the build to complete (usually 2-3 minutes)
4. Once deployed, you'll get a URL like: `https://osint-app-production.railway.app`
5. **Your app is now live!** 🎉

---

## 🚀 Alternative: Deploy to Render

Render is another great free option.

### Step 1: Create Render Account

1. Go to **https://render.com**
2. Click **"Sign up"**
3. Sign up with GitHub (recommended)
4. Authorize Render to access your GitHub

### Step 2: Create Web Service

1. In Render dashboard, click **"New +"**
2. Select **"Web Service"**
3. Connect your GitHub repository with the osint-app code

### Step 3: Configure Service

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `osint-app` |
| **Environment** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Free (or paid if you want) |

### Step 4: Add Environment Variables

1. Scroll down to **"Environment"** section
2. Add these variables:
   ```
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=<generate_random_string>
   DATABASE_URL=./osint.db
   ```

3. Click **"Create Web Service"**
4. Render will build and deploy automatically
5. Your app will be live at a URL like: `https://osint-app.onrender.com`

---

## 💻 Advanced: Self-Hosted on Your Own Server

If you want full control, you can host it on a VPS (Virtual Private Server).

### Step 1: Get a VPS

Choose one of these providers:
- **DigitalOcean** (https://digitalocean.com) - $5/month
- **Linode** (https://linode.com) - $5/month
- **AWS EC2** (https://aws.amazon.com) - Free tier available
- **Vultr** (https://vultr.com) - $2.50/month

**Recommended:** DigitalOcean - very beginner-friendly

### Step 2: Create a Droplet (Server)

1. In DigitalOcean, click **"Create"** → **"Droplets"**
2. Choose:
   - **Image**: Ubuntu 22.04 LTS
   - **Size**: Basic ($5/month)
   - **Region**: Closest to you
3. Click **"Create Droplet"**
4. You'll get an IP address (e.g., `123.45.67.89`)

### Step 3: Connect to Your Server

1. Open terminal on your computer
2. Connect via SSH:
   ```bash
   ssh root@YOUR_SERVER_IP
   ```
   (Replace `YOUR_SERVER_IP` with the IP from step 2)

3. You'll be asked for a password - check your email from DigitalOcean

### Step 4: Install Node.js

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 5: Upload Your Project

```bash
# Create app directory
mkdir -p /var/www/osint-app
cd /var/www/osint-app

# Option A: Clone from GitHub
git clone https://github.com/YOUR_USERNAME/osint-app.git .

# Option B: Upload files manually
# Use SCP or SFTP to upload your files
```

### Step 6: Install Dependencies

```bash
cd /var/www/osint-app
npm install
npm run build
```

### Step 7: Install PM2 (Process Manager)

PM2 keeps your app running even if it crashes:

```bash
sudo npm install -g pm2

# Start your app
pm2 start server.js --name "osint-app"

# Make it start on reboot
pm2 startup
pm2 save
```

### Step 8: Set Up Nginx (Web Server)

```bash
# Install Nginx
sudo apt-get install -y nginx

# Create config file
sudo nano /etc/nginx/sites-available/osint-app
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Replace `YOUR_DOMAIN.com` with your actual domain (or use the IP address).

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/osint-app /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### Step 9: Set Up SSL Certificate (HTTPS)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d YOUR_DOMAIN.com
```

Follow the prompts. Your app is now secure with HTTPS! 🔒

### Step 10: Access Your App

Visit your domain or IP address in a browser:
- With domain: `https://YOUR_DOMAIN.com`
- With IP: `http://YOUR_SERVER_IP`

---

## 🔐 Important Security Steps (For All Deployments)

Before going live, do these:

### 1. Change JWT_SECRET

Generate a strong random string:
```bash
openssl rand -base64 32
```

Use this value for `JWT_SECRET` in your environment variables.

### 2. Set NODE_ENV to Production

Make sure `NODE_ENV=production` in your environment variables.

### 3. Enable HTTPS

- Railway: Automatic ✓
- Render: Automatic ✓
- Self-hosted: Use Let's Encrypt (instructions above)

### 4. Database Backups

For production, consider:
- Using PostgreSQL instead of SQLite
- Setting up automated backups
- Keeping backups in a separate location

### 5. Rate Limiting (Optional but Recommended)

Add this to your `server.js` to prevent abuse:

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

Then install the package:
```bash
npm install express-rate-limit
```

---

## 🧪 Testing Your Deployment

After deployment:

1. **Test Registration**
   - Create a new account
   - Verify email (if you set that up)

2. **Test Features**
   - Try username search
   - Try domain lookup
   - Try breach checker

3. **Test Search History**
   - Make a search
   - Go to History tab
   - Verify it's saved

4. **Test Investigations**
   - Create a new case
   - Verify it's saved

---

## 🐛 Troubleshooting

### App won't start
```bash
# Check logs
pm2 logs osint-app

# Restart
pm2 restart osint-app
```

### Database errors
```bash
# Reset database
rm osint.db
pm2 restart osint-app
```

### Port already in use
```bash
# Find process using port 5000
lsof -i :5000

# Kill it
kill -9 <PID>
```

### CORS errors
- Make sure frontend URL matches backend CORS config
- Check that API requests include `Authorization` header

### Can't connect to database
- Check `DATABASE_URL` in environment variables
- Ensure write permissions to database file
- Check available disk space

---

## 📊 Monitoring Your App

### Railway
- Dashboard shows CPU, memory, logs
- Automatic restarts on crashes

### Render
- Dashboard shows build logs, runtime logs
- Automatic restarts on crashes

### Self-hosted
```bash
# Check app status
pm2 status

# View logs
pm2 logs osint-app

# Monitor in real-time
pm2 monit
```

---

## 🎓 Next Steps

After deployment:

1. **Share your app** with friends and family
2. **Integrate real APIs** for actual OSINT data
3. **Add more features** like:
   - Social media profile scraping
   - Reverse image search
   - Phone number lookup
4. **Set up analytics** to see who's using your app
5. **Add email notifications** for saved searches

---

## 📞 Getting Help

If you get stuck:

1. Check the **README.md** in your project
2. Read the error message carefully - it usually tells you what's wrong
3. Search the service's documentation (Railway, Render, etc.)
4. Ask in developer communities like Stack Overflow or Reddit

---

## ✅ Deployment Checklist

Before going live:

- [ ] Changed `JWT_SECRET` to a strong random string
- [ ] Set `NODE_ENV=production`
- [ ] Tested all features locally
- [ ] Tested registration and login
- [ ] Verified HTTPS is enabled
- [ ] Set up database backups (if self-hosted)
- [ ] Added environment variables to deployment platform
- [ ] Tested the live app in a browser
- [ ] Shared the URL with someone to test

---

**Congratulations! Your OSINT Nexus app is ready to go live! 🎉**

If you have any questions, feel free to ask!
