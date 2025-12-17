# 3CX Pro Manager - Quick Start Guide

## 🚀 Fast Deployment in 10 Minutes

This guide will get your 3CX Pro Manager up and running quickly on Render and Supabase.

---

## Step 1: Setup Supabase Database (3 minutes)

### 1.1 Create Project
1. Go to https://supabase.com
2. Sign in or create account
3. Click **"New Project"**
4. Fill in:
   - **Name**: `3cx-pro-manager`
   - **Password**: Choose a strong password (save it!)
   - **Region**: Select closest to you
5. Click **"Create new project"**
6. Wait ~2 minutes for provisioning

### 1.2 Run Database Setup
1. In Supabase, go to **"SQL Editor"** (left sidebar)
2. Click **"New Query"**
3. Copy the entire content from `database_setup.sql` file in this repo
4. Paste into the SQL editor
5. Click **"Run"** button
6. You should see success message: "3 tables created"

### 1.3 Get Database Credentials
1. Go to **"Project Settings"** (gear icon, bottom left)
2. Click **"Database"**
3. **Copy and save** these values:
   - **Host**: (looks like `db.xxxxxxxxxxxx.supabase.co`)
   - **Database name**: `postgres`
   - **Port**: `5432`
   - **User**: `postgres`
   - **Password**: (your password from step 1.1)

---

## Step 2: Deploy to Render (5 minutes)

### 2.1 Create Web Service
1. Go to https://render.com
2. Sign in or create account
3. Click **"New +"** button (top right)
4. Select **"Web Service"**

### 2.2 Connect GitHub Repository
1. Click **"Connect GitHub"** (if not already connected)
2. Authorize Render
3. Search for **"3cx-pro-manager"**
4. Click **"Connect"** on your repository

### 2.3 Configure Service
Fill in the following:

- **Name**: `3cx-pro-manager` (or your preferred name)
- **Region**: Select closest to you
- **Branch**: `main`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Instance Type**: `Free` (or paid for better performance)

### 2.4 Add Environment Variables
Click **"Add Environment Variable"** and add these (replace with your actual values):

```
PORT=3000

DB_HOST=db.xxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_supabase_password_here

SESSION_SECRET=your_random_32_character_secret_here

NODE_ENV=production
```

**Generate SESSION_SECRET:**
- Open terminal and run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Or use: https://www.random.org/strings/ (generate 32 character string)

### 2.5 Deploy
1. Click **"Create Web Service"**
2. Wait 2-3 minutes for deployment
3. Your app will be live at: `https://your-service-name.onrender.com`

---

## Step 3: Test Your Application (2 minutes)

### 3.1 Access Application
1. Open your Render URL: `https://your-service-name.onrender.com`
2. You should see the 3CX Pro Manager interface

### 3.2 Add Test Customer
1. Click **"Customers"** in navigation
2. Click **"Add Customer"** button
3. Fill in test data:
   - Company Name: "Test Company"
   - Contact Person: "John Doe"
   - Email: "test@example.com"
   - Phone: "123-456-7890"
4. Click **"Save"**

### 3.3 Verify Database
1. Go back to Supabase
2. Click **"Table Editor"**
3. Select **"customers"** table
4. You should see your test customer!

---

## ✅ Success!

Your 3CX Pro Manager is now live and ready to use!

### What You Can Do Now:

1. **Add Customers**: Manage your 3CX clients
2. **Add Licenses**: Track license keys, expiry dates, and system credentials
3. **Schedule Maintenance**: Log and track maintenance tasks
4. **Auto-Fetch System Info**: When you add 3CX credentials to a license, system info is automatically fetched

---

## 🔧 Common Issues

### Issue: Application won't start
- **Check**: Render logs for error messages
- **Verify**: All environment variables are set correctly
- **Solution**: Ensure DB credentials match Supabase exactly

### Issue: Database connection error
- **Check**: Supabase project is active (green status)
- **Verify**: Password is correct (no extra spaces)
- **Solution**: Copy credentials again from Supabase settings

### Issue: Can't add data
- **Check**: Database tables were created successfully
- **Solution**: Re-run the `database_setup.sql` script in Supabase

---

## 📚 Next Steps

1. **Read Full Documentation**: See `DEPLOYMENT.md` for detailed configuration
2. **Configure White Label**: Customize branding for your company
3. **Add Real Data**: Start adding your actual customers and licenses
4. **Test 3CX Integration**: Add license with 3CX credentials to test API
5. **Set Up Backups**: Configure regular database backups in Supabase

---

## 🔐 Security Checklist

- [ ] Changed default SESSION_SECRET to random 32+ character string
- [ ] Using strong Supabase database password
- [ ] Kept all credentials secure (not in public repos)
- [ ] Application running on HTTPS (Render provides this automatically)

---

## 💡 Quick Commands

### Generate SESSION_SECRET
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### View Render Logs
Go to Render Dashboard → Your Service → Logs tab

### Backup Database
Go to Supabase Dashboard → Database → Backups → Take Backup

---

## 📞 Support

If you encounter any issues:
1. Check Render logs (for application errors)
2. Check Supabase logs (for database errors)  
3. Review `DEPLOYMENT.md` (for detailed troubleshooting)
4. Check GitHub Issues

---

## 🎉 You're All Set!

Your 3CX Pro Manager is now deployed and ready to help you manage your 3CX customers, licenses, and maintenance tasks efficiently!

**Deployed URL**: `https://your-service-name.onrender.com`

Enjoy using 3CX Pro Manager! 🚀
