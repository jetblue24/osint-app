# 🔍 OSINT Nexus - Open Source Intelligence Platform

A user-friendly mobile-optimized web application for conducting open-source intelligence (OSINT) investigations. Perfect for anyone who wants to discover usernames, look up domain information, check for email breaches, and manage their investigations.

## Features

✅ **Username Discovery** - Search for usernames across 100+ social media platforms
✅ **Domain & IP Lookup** - Get DNS records, WHOIS information, and geolocation data
✅ **Email Breach Checker** - Check if emails appear in known data breaches
✅ **Search History** - Keep track of all your previous searches
✅ **Investigation Cases** - Create and organize your OSINT investigations
✅ **User Authentication** - Secure login and registration
✅ **Mobile-Friendly** - Fully responsive design for mobile, tablet, and desktop

## Tech Stack

- **Frontend**: React 19 + Vite
- **Backend**: Express.js
- **Database**: SQLite
- **Authentication**: JWT + bcryptjs
- **Styling**: CSS3 with mobile-first design

## Project Structure

```
osint-app/
├── server.js              # Express backend server
├── vite.config.js         # Vite configuration
├── index.html             # HTML entry point
├── .env                   # Environment variables
├── package.json           # Dependencies
└── src/
    ├── main.jsx           # React entry point
    ├── App.jsx            # Main app component
    ├── App.css            # Global styles
    ├── index.css          # CSS variables and resets
    ├── pages/
    │   ├── Auth.jsx       # Login/Register page
    │   ├── Auth.css
    │   ├── Dashboard.jsx  # Main dashboard
    │   └── Dashboard.css
    └── components/
        ├── UsernameSearch.jsx
        ├── UsernameSearch.css
        ├── DomainLookup.jsx
        ├── DomainLookup.css
        ├── BreachChecker.jsx
        ├── BreachChecker.css
        ├── SearchHistory.jsx
        ├── SearchHistory.css
        ├── Investigations.jsx
        └── Investigations.css
```

## Getting Started Locally

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone or download the project**
   ```bash
   cd osint-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Edit `.env` file with your configuration:
   ```
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_key_change_this_in_production
   DATABASE_URL=./osint.db
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:5000`

## Building for Production

1. **Build the React frontend**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

The built files will be in the `dist/` directory and served by Express.

## Deployment Guide

### Option 1: Deploy to Railway (Recommended for Beginners)

Railway is the easiest option for deploying this app. Here's how:

1. **Create a Railway account**
   - Go to https://railway.app
   - Sign up with GitHub or email

2. **Connect your project**
   - Click "Create New Project"
   - Select "Deploy from GitHub" or upload files
   - Connect your repository or upload the project folder

3. **Configure environment variables**
   - In Railway dashboard, go to "Variables"
   - Add these variables:
     ```
     PORT=5000
     NODE_ENV=production
     JWT_SECRET=generate_a_strong_random_string_here
     DATABASE_URL=./osint.db
     ```

4. **Deploy**
   - Railway will automatically detect Node.js
   - Click "Deploy" and wait for completion
   - Your app will be live at a Railway-provided URL

### Option 2: Deploy to Render

1. **Create a Render account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create a new Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

3. **Configure the service**
   - **Name**: osint-app
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

4. **Add environment variables**
   - Go to "Environment" section
   - Add the same variables as above

5. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy your app

### Option 3: Deploy to Vercel (Frontend only, requires separate backend)

Vercel is best for static sites. For this full-stack app, use Railway or Render instead.

### Option 4: Self-Hosted (VPS/Dedicated Server)

1. **Get a VPS**
   - Use providers like DigitalOcean, Linode, or AWS EC2
   - Choose Ubuntu 20.04 LTS or newer

2. **SSH into your server**
   ```bash
   ssh root@your_server_ip
   ```

3. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Clone your project**
   ```bash
   git clone your_repo_url osint-app
   cd osint-app
   ```

5. **Install dependencies**
   ```bash
   npm install
   npm run build
   ```

6. **Install PM2 (process manager)**
   ```bash
   sudo npm install -g pm2
   ```

7. **Start the app with PM2**
   ```bash
   pm2 start server.js --name "osint-app"
   pm2 startup
   pm2 save
   ```

8. **Set up Nginx as reverse proxy**
   ```bash
   sudo apt-get install nginx
   ```

   Create `/etc/nginx/sites-available/osint-app`:
   ```nginx
   server {
       listen 80;
       server_name your_domain.com;

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

   Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/osint-app /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

9. **Set up SSL with Let's Encrypt**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your_domain.com
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login to account

### OSINT Features
- `POST /api/osint/username-search` - Search for username across platforms
- `POST /api/osint/domain-lookup` - Look up domain information
- `POST /api/osint/breach-check` - Check if email is in breaches

### Data Management
- `GET /api/searches` - Get search history
- `POST /api/investigations` - Create investigation case
- `GET /api/investigations` - Get all investigations

## Important Notes

⚠️ **Before Production Deployment:**

1. **Change JWT_SECRET** to a strong random string
2. **Enable HTTPS** on your domain
3. **Set NODE_ENV=production**
4. **Use a proper database** (PostgreSQL recommended for production instead of SQLite)
5. **Set up backups** for your database
6. **Add rate limiting** to prevent abuse
7. **Enable CORS** only for your domain

## Customization

### Adding Real API Integration

The app currently uses mock data. To integrate real APIs:

1. **For username search**: Use services like Sherlock or Holehe
2. **For domain lookup**: Use APIs like Shodan, AbuseIPDB, or VirusTotal
3. **For breach checking**: Use Have I Been Pwned API

Update the endpoints in `server.js` to call these APIs.

## Troubleshooting

**Port already in use**
```bash
# Change PORT in .env or kill the process
lsof -i :5000
kill -9 <PID>
```

**Database locked**
```bash
# Delete the database and restart
rm osint.db
npm run dev
```

**CORS errors**
- Make sure the frontend URL matches the backend CORS configuration
- Check that requests include proper `Authorization` headers

## Support & Contributing

For issues or suggestions, please open an issue in the repository.

## License

ISC

---

**Happy investigating! 🔍**
