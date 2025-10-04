# 🚀 Production Deployment Guide

## Overview

This guide will help you deploy **Dinky Metal ERP v2** to production safely and efficiently.

---

## 📋 Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Production `.env` file configured
- [ ] Supabase production project created
- [ ] All migrations applied to production database
- [ ] Environment variables verified

### 2. Security Configuration
- [ ] Auth security settings enabled (MFA, password protection)
- [ ] RLS policies verified on all tables
- [ ] Database function security hardened
- [ ] API keys rotated (if needed)

### 3. Performance Optimization
- [ ] All foreign key indexes created
- [ ] Unused indexes removed
- [ ] Database queries optimized

### 4. Application Testing
- [ ] All features tested in staging
- [ ] Authentication flow verified
- [ ] CRUD operations tested
- [ ] Reports generation tested

---

## 🔧 Deployment Steps

### Step 1: Prepare Production Environment

#### 1.1 Create Production Supabase Project
```bash
# Go to https://supabase.com/dashboard
# Click "New Project"
# Select organization and region (eu-central-2 recommended)
# Wait for project initialization (~2 minutes)
```

#### 1.2 Configure Environment Variables
Create `.env.production`:
```bash
VITE_SUPABASE_URL=https://your-production-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_APP_NAME=Dinky Metal ERP
VITE_APP_VERSION=2.0.0
```

### Step 2: Database Setup

#### 2.1 Apply Migrations
Run migrations in order:
```bash
# Via Supabase Dashboard SQL Editor:
# 1. Copy content from sql/migrations/001_security_and_performance_fixes.sql
# 2. Paste and execute in SQL Editor
# 3. Verify success messages
```

#### 2.2 Verify Database Schema
```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should return: 9 tables
```

#### 2.3 Enable Activity Monitoring
```bash
# Copy content from sql/create_activity_monitoring.sql
# Execute in SQL Editor
# Verify RPC functions created
```

### Step 3: Configure Security

#### 3.1 Enable Auth Security (Manual in Supabase Dashboard)
Follow instructions in `docs/SECURITY_CONFIGURATION.md`:
1. Enable leaked password protection
2. Enable MFA (at least 2 methods)
3. Configure password policy (12+ characters)
4. Set rate limits

#### 3.2 Verify RLS Policies
```sql
-- Check RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- All should have rowsecurity = true
```

### Step 4: Build Application

#### 4.1 Install Dependencies
```bash
npm install
```

#### 4.2 Build for Production
```bash
npm run build
```

This creates optimized bundle in `dist/` directory.

#### 4.3 Verify Build
```bash
# Check dist folder created
ls -la dist/

# Should contain:
# - index.html
# - assets/ (JS, CSS bundles)
# - favicon
```

### Step 5: Deploy to Hosting

#### Option A: Vercel (Recommended)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
vercel --prod
```

3. **Configure Environment Variables**
```bash
# In Vercel Dashboard → Project Settings → Environment Variables
# Add all variables from .env.production
```

#### Option B: Netlify

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Deploy**
```bash
netlify deploy --prod --dir=dist
```

3. **Configure Environment Variables**
In Netlify Dashboard → Site Settings → Environment Variables

#### Option C: AWS S3 + CloudFront

1. **Build the app**
```bash
npm run build
```

2. **Upload to S3**
```bash
aws s3 sync dist/ s3://your-bucket-name --delete
```

3. **Invalidate CloudFront cache**
```bash
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

#### Option D: Self-Hosted (Nginx)

1. **Copy build files to server**
```bash
scp -r dist/* user@server:/var/www/dinky-erp/
```

2. **Configure Nginx**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/dinky-erp;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

3. **Enable SSL with Let's Encrypt**
```bash
sudo certbot --nginx -d your-domain.com
```

### Step 6: Post-Deployment Verification

#### 6.1 Health Checks
```bash
# Test these endpoints:
✅ Homepage loads
✅ Login works
✅ Dashboard loads
✅ Data fetching works
✅ CRUD operations work
✅ Reports generate
```

#### 6.2 Monitor Logs
- **Supabase**: Check Auth Logs and API Logs
- **Application**: Check browser console for errors
- **Network**: Check API response times

#### 6.3 Performance Checks
```bash
# Use Lighthouse or PageSpeed Insights
# Target metrics:
✅ Performance: >90
✅ Accessibility: >95
✅ Best Practices: >95
✅ SEO: >90
```

---

## 🔄 Rollback Plan

If deployment fails:

### Quick Rollback
```bash
# Vercel
vercel rollback

# Netlify
netlify rollback

# Self-hosted
git checkout previous-tag
npm run build
# Re-deploy
```

### Database Rollback
```sql
-- Restore from backup
-- Contact Supabase support for point-in-time recovery
```

---

## 📊 Monitoring Setup

### 1. Supabase Monitoring
- **Dashboard**: Monitor API usage, errors
- **Logs**: Check auth and database logs daily
- **Alerts**: Set up email notifications for errors

### 2. Application Monitoring (Optional)

#### Sentry Setup
```bash
npm install @sentry/react
```

```javascript
// src/main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production",
  tracesSampleRate: 1.0,
});
```

#### LogRocket Setup (Optional)
```bash
npm install logrocket
```

### 3. Uptime Monitoring
Use services like:
- UptimeRobot (free)
- Pingdom
- StatusCake

---

## 🔐 Security Checklist (Post-Deployment)

- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Sensitive data not exposed in client
- [ ] API keys not in source code
- [ ] Regular security updates scheduled

---

## 📈 Performance Optimization

### 1. Enable Caching
```nginx
# Nginx cache configuration
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 2. CDN Setup (Optional)
- Use Cloudflare for global CDN
- Enable auto-minification
- Enable Brotli compression

### 3. Database Optimization
- Monitor slow queries in Supabase Dashboard
- Add indexes for frequently queried columns
- Enable connection pooling

---

## 🆘 Troubleshooting

### Issue: White screen after deployment
**Solution**:
```bash
# Check base URL in vite.config.js
# Ensure routes match deployment path
# Clear cache and redeploy
```

### Issue: API calls failing
**Solution**:
```bash
# Verify VITE_SUPABASE_URL is correct
# Check CORS settings in Supabase
# Verify RLS policies allow operations
```

### Issue: Slow loading
**Solution**:
```bash
# Enable Gzip/Brotli compression
# Optimize images
# Code splitting (React.lazy)
# CDN for static assets
```

---

## 📞 Support & Maintenance

### Daily Tasks
- Check error logs
- Monitor uptime
- Review user feedback

### Weekly Tasks
- Review performance metrics
- Check security advisors in Supabase
- Update dependencies (if needed)

### Monthly Tasks
- Review access logs
- Rotate API keys (if policy requires)
- Backup database
- Security audit

---

## 🎯 Success Criteria

Your deployment is successful when:

✅ Application loads in <2 seconds
✅ All features work correctly
✅ No console errors
✅ Authentication flows work
✅ Database operations complete successfully
✅ Reports generate correctly
✅ Mobile responsive
✅ Security best practices followed

---

## 📝 Change Log

Track all production deployments:

```
v2.0.0 - 2025-10-02
- Initial production deployment
- All Phase 1 & 2 features complete
- Security hardening applied
- Performance optimizations applied
```

---

**Deployment completed?** 🎉

Next steps:
1. Monitor for 24-48 hours
2. Collect user feedback
3. Plan Phase 3 (Testing) improvements
4. Schedule regular maintenance

**Need help?** Check `docs/SECURITY_CONFIGURATION.md` and `README.md`
