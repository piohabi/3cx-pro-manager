# 3CX Pro Manager - Deployment Guide

## Overview
This guide provides complete step-by-step instructions for deploying the 3CX Pro Manager application using Render (hosting) and Supabase (database).

## Prerequisites
- GitHub account
- Render account (https://render.com)
- Supabase account (https://supabase.com)
- Git installed on your local machine

---

## Part 1: Supabase Database Setup

### 1.1 Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in project details:
   - Name: `3cx-pro-manager`
   - Database Password: (Choose a strong password and save it)
   - Region: (Choose closest to your location)
4. Click "Create new project"
5. Wait for database to be provisioned (~2 minutes)

### 1.2 Create Database Tables

1. In your Supabase project, go to "SQL Editor"
2. Click "New Query"
3. Copy and paste the following SQL:

```sql
-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create licenses table
CREATE TABLE IF NOT EXISTS licenses (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  license_key VARCHAR(255) NOT NULL UNIQUE,
  license_type VARCHAR(100),
  max_users INTEGER,
  purchase_date DATE,
  expiry_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  system_url VARCHAR(255),
  system_username VARCHAR(255),
  system_password VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create maintenance table
CREATE TABLE IF NOT EXISTS maintenance (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  license_id INTEGER REFERENCES licenses(id) ON DELETE SET NULL,
  maintenance_type VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  scheduled_date TIMESTAMP,
  completed_date TIMESTAMP,
  technician VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_licenses_customer_id ON licenses(customer_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_customer_id ON maintenance(customer_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_scheduled_date ON maintenance(scheduled_date);

-- Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your security needs)
CREATE POLICY "Enable all access for now" ON customers FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON licenses FOR ALL USING (true);
CREATE POLICY "Enable all access for now" ON maintenance FOR ALL USING (true);
```

4. Click "Run" to execute the SQL
5. Verify tables were created by checking "Table Editor" in left sidebar

### 1.3 Get Connection Details

1. Go to "Project Settings" (gear icon in left sidebar)
2. Click "Database" section
3. Copy and save these values:
   - **Host**: (e.g., `db.xxxxxxxxxxxx.supabase.co`)
   - **Database name**: `postgres`
   - **Port**: `5432`
   - **User**: `postgres`
   - **Password**: (The password you set during project creation)

4. Also get the **Connection String**:
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres`

---

## Part 2: Render Deployment

### 2.1 Prepare Repository

Your repository should already have these files:
- `package.json`
- `server.js`
- `render.yaml`
- `.env.example`

### 2.2 Deploy to Render

1. Go to https://render.com and sign in
2. Click "New +" button
3. Select "Web Service"
4. Connect your GitHub repository:
   - Click "Connect GitHub"
   - Authorize Render to access your repositories
   - Search for `3cx-pro-manager`
   - Click "Connect"

5. Configure the service:
   - **Name**: `3cx-pro-manager`
   - **Region**: (Choose closest to you)
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free` (or choose paid plan for better performance)

6. Add Environment Variables:
   Click "Add Environment Variable" and add these:

   ```
   PORT=3000
   
   DB_HOST=db.xxxxxxxxxxxx.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=your_supabase_password
   
   SESSION_SECRET=your_random_secret_key_here_min_32_chars
   
   NODE_ENV=production
   ```

   **Important**: Replace the DB values with your actual Supabase credentials from Part 1.3

   To generate a secure SESSION_SECRET, you can use:
   - Online: https://www.random.org/strings/
   - Or run in terminal: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

7. Click "Create Web Service"

### 2.3 Wait for Deployment

1. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Start your application

2. Watch the deployment logs in real-time
3. Wait for "Your service is live" message
4. You'll see a URL like: `https://3cx-pro-manager.onrender.com`

---

## Part 3: Verify Deployment

### 3.1 Test Application

1. Open your Render URL in a browser
2. You should see the login page
3. Test adding a customer:
   - Click "Customers" in navigation
   - Click "Add Customer"
   - Fill in customer details
   - Click "Save"

### 3.2 Test Database Connection

1. Go back to Supabase
2. Open "Table Editor"
3. Select "customers" table
4. You should see the customer you just added

### 3.3 Test 3CX Integration

1. Add a license with 3CX credentials:
   - Go to "Licenses" section
   - Click "Add License"
   - Fill in all fields including:
     - System URL (e.g., `https://your-3cx.com`)
     - System Username
     - System Password
   - Click "Save"

2. Click "Edit" on the license
3. Go to "System Info" tab
4. System information should be automatically fetched from 3CX API

---

## Part 4: Post-Deployment Configuration

### 4.1 Custom Domain (Optional)

1. In Render dashboard, go to your service
2. Click "Settings"
3. Scroll to "Custom Domain"
4. Click "Add Custom Domain"
5. Follow instructions to configure DNS

### 4.2 Enable Auto-Deploy

Render automatically deploys when you push to the `main` branch.
To disable auto-deploy:
1. Go to "Settings"
2. Scroll to "Build & Deploy"
3. Toggle "Auto-Deploy"

### 4.3 Monitoring

1. **Render Metrics**: Check CPU, Memory, and Request metrics in Render dashboard
2. **Logs**: View live logs in "Logs" tab
3. **Supabase**: Monitor database usage in Supabase dashboard

---

## Part 5: Troubleshooting

### Common Issues

#### 1. Application won't start
- Check Render logs for error messages
- Verify all environment variables are set correctly
- Ensure DATABASE_URL is in correct format

#### 2. Database connection failed
- Verify Supabase credentials
- Check if Supabase project is active
- Ensure IP restrictions allow Render's IPs (Supabase allows all by default)

#### 3. 3CX API not working
- Verify 3CX credentials are correct
- Check 3CX system is accessible from internet
- Ensure 3CX API is enabled
- Check CORS settings if getting network errors

#### 4. Session issues
- Verify SESSION_SECRET is set and at least 32 characters
- Clear browser cookies
- Check if cookies are enabled in browser

### Logs Location

- **Application Logs**: Render Dashboard > Your Service > Logs
- **Database Logs**: Supabase Dashboard > Logs

---

## Part 6: Maintenance

### Database Backups

Supabase automatically backs up your database daily. To create manual backup:
1. Go to Supabase Dashboard
2. Database > Backups
3. Click "Take Backup"

### Update Application

1. Make changes to your code locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```
3. Render automatically detects changes and deploys

### Scale Up

If you need better performance:
1. Go to Render Dashboard > Your Service > Settings
2. Change "Instance Type" to a paid plan
3. Click "Save Changes"

---

## Part 7: Security Best Practices

1. **Change default passwords immediately**
2. **Use strong SESSION_SECRET** (32+ characters, random)
3. **Enable HTTPS** (Render provides this automatically)
4. **Regularly update dependencies**: `npm update`
5. **Monitor logs** for suspicious activity
6. **Set up Supabase RLS policies** for production
7. **Use environment variables** for all sensitive data
8. **Regular backups** of database

---

## Support

For issues:
1. Check Render logs
2. Check Supabase logs
3. Review this deployment guide
4. Check GitHub Issues

---

## Quick Reference Commands

### Generate SESSION_SECRET
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### View Render Logs
```bash
render logs -s 3cx-pro-manager
```

### Test Database Connection
```bash
psql postgresql://postgres:[PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
```

---

## Deployment Checklist

- [ ] Supabase project created
- [ ] Database tables created
- [ ] Supabase credentials copied
- [ ] Render service created
- [ ] Environment variables configured
- [ ] Application deployed successfully
- [ ] Login page accessible
- [ ] Database connection working
- [ ] Customer CRUD operations working
- [ ] License CRUD operations working
- [ ] Maintenance CRUD operations working
- [ ] 3CX API integration working
- [ ] System info auto-fetch working

---

**Deployment Date**: _________________
**Deployed URL**: _________________
**Database URL**: _________________

---

## Next Steps

1. Configure white-label settings
2. Set up user authentication (if required)
3. Configure backup schedule
4. Set up monitoring alerts
5. Train users on the system
