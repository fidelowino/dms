# Dawamu School Management System v2.0

## Quick Start (Local)

1. Install dependencies:
```
npm install
```

2. Create your `.env` file:
```
cp .env.example .env
```
Then open `.env` and fill in your Gmail App Password.

3. Start the server:
```
npm start
```

4. Open browser at `http://localhost:3000`

## Default Passwords
| Role | Password |
|------|----------|
| admin | admin123 |
| catering | cater123 |
| farm | farm123 |
| transport | trans123 |
| housekeeping | house123 |
| maintenance | maint123 |

> Change all passwords after first login via Admin → Manage Passwords

## Deploy to Railway

1. Push to GitHub
2. Connect repo on railway.app
3. Add environment variables:
   - `GMAIL_USER` = fidelowino8@gmail.com
   - `GMAIL_APP_PASSWORD` = your app password
4. Railway auto-detects `npm start` — done!

## Gmail App Password Setup
1. Go to Google Account → Security
2. Enable 2-Factor Authentication
3. Go to App Passwords
4. Create new app password → copy the 16-char code
5. Paste into `.env` as `GMAIL_APP_PASSWORD`
