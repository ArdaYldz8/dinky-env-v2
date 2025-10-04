# 🔐 Security Configuration Guide

## Auth Security Settings (Manual Configuration Required)

These security features must be enabled manually in the Supabase Dashboard.

---

## 1. Enable Leaked Password Protection

### Steps:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: `dinky-v2` (lcsaxzfzrqinqfazkoaw)
3. Navigate to: **Authentication** → **Providers** → **Email**
4. Scroll to **Password Settings**
5. Enable: ✅ **"Enable password breach detection"**
   - This checks passwords against HaveIBeenPwned.org database
   - Prevents users from using compromised passwords
6. Click **Save**

### Benefits:
- Prevents use of leaked/compromised passwords
- Enhances account security
- Industry best practice

**Documentation**: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

---

## 2. Enable Multi-Factor Authentication (MFA)

### Steps:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: `dinky-v2` (lcsaxzfzrqinqfazkoaw)
3. Navigate to: **Authentication** → **Providers**
4. Enable MFA options:

#### Option A: TOTP (Time-based One-Time Password) - RECOMMENDED
   - Enable: ✅ **"Phone (SMS)"** or **"Authenticator App (TOTP)"**
   - Configure SMS provider (Twilio/MessageBird) OR
   - Use authenticator apps (Google Authenticator, Authy, etc.)

#### Option B: Phone Auth
   - Enable: ✅ **"Phone"**
   - Configure SMS provider

5. Set MFA Policy:
   - Navigate to: **Authentication** → **Policies**
   - Set: **"Require MFA for all users"** or **"Optional"**

### Benefits:
- Adds second layer of security
- Prevents unauthorized access even if password is compromised
- Required for compliance in many industries

**Documentation**: https://supabase.com/docs/guides/auth/auth-mfa

---

## 3. Additional Security Settings (Recommended)

### Password Policy
1. **Authentication** → **Providers** → **Email**
2. Configure:
   - ✅ Minimum password length: **12 characters** (current: 6)
   - ✅ Require uppercase letters
   - ✅ Require numbers
   - ✅ Require special characters

### Session Management
1. **Authentication** → **Settings**
2. Configure:
   - JWT expiry: **3600 seconds** (1 hour) for better security
   - Refresh token rotation: ✅ **Enabled**
   - Max concurrent sessions: **3** (prevent account sharing)

### Email Verification
1. **Authentication** → **Providers** → **Email**
2. Ensure:
   - ✅ **Confirm email** is enabled
   - ✅ **Secure email change** is enabled

### Rate Limiting
1. **Authentication** → **Rate Limits**
2. Configure:
   - Login attempts: **5 per hour** per IP
   - Password reset: **3 per hour** per email
   - Sign up: **10 per hour** per IP

---

## 4. Security Headers (Already Configured)

These are handled by Supabase automatically:
- ✅ HTTPS enforced
- ✅ CORS configured
- ✅ Row Level Security (RLS) enabled on all tables

---

## 5. Environment Variables Security

### Current Status:
```
VITE_SUPABASE_URL=https://lcsaxzfzrqinqfazkoaw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci... (anon key - safe to expose)
```

### Notes:
- ✅ Anon key is safe to expose in client-side code
- ✅ Service role key is NOT in .env.local (correct)
- ⚠️ Never commit `.env.local` to git

### Production Configuration:
Create `.env.production` for production build:
```bash
VITE_SUPABASE_URL=https://your-production-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

---

## 6. Verification Checklist

After completing manual configurations, verify:

- [ ] Leaked password protection enabled
- [ ] At least 2 MFA methods enabled
- [ ] Password policy strengthened (12+ chars)
- [ ] Email verification enabled
- [ ] Rate limiting configured
- [ ] JWT expiry set to 1 hour
- [ ] Refresh token rotation enabled

---

## 7. Security Monitoring

### Supabase Dashboard Monitoring:
1. **Logs** → **Auth Logs**: Monitor login attempts
2. **Database** → **Roles**: Verify RLS policies
3. **API** → **Logs**: Check for suspicious activity

### Recommended External Tools:
- **Sentry**: Error tracking and monitoring
- **LogRocket**: Session replay and monitoring
- **Datadog**: APM and infrastructure monitoring

---

## 8. Security Best Practices for Development

### For Developers:
1. Never log sensitive data (passwords, tokens)
2. Use HTTPS in production
3. Validate all user inputs
4. Sanitize data before database operations
5. Keep dependencies updated
6. Use content security policy (CSP)

### Code Review Checklist:
- [ ] No hardcoded credentials
- [ ] Input validation implemented
- [ ] SQL injection prevention (using Supabase client)
- [ ] XSS prevention (React handles by default)
- [ ] CSRF protection (Supabase handles)

---

## 9. Incident Response Plan

### If Security Breach Detected:
1. **Immediate Actions**:
   - Rotate all API keys immediately
   - Force logout all users
   - Review audit logs
   - Identify compromised data

2. **Investigation**:
   - Check `activity_logs` table
   - Review Supabase auth logs
   - Analyze access patterns

3. **Remediation**:
   - Patch vulnerability
   - Notify affected users
   - Reset passwords if needed
   - Update security policies

4. **Prevention**:
   - Implement additional controls
   - Update documentation
   - Train team on security

---

## 10. Compliance Notes

### GDPR Compliance:
- ✅ User data encrypted at rest
- ✅ User data encrypted in transit
- ⚠️ Implement data export functionality
- ⚠️ Implement right to be forgotten

### Data Retention:
- Activity logs: 90 days (recommended)
- User data: As per policy
- Backup retention: 30 days

---

## Support & Resources

- **Supabase Security Docs**: https://supabase.com/docs/guides/auth/auth-deep-dive/auth-deep-dive
- **Supabase Support**: support@supabase.io
- **Emergency Contact**: [Your security team contact]

---

**Last Updated**: 2025-10-02
**Next Review**: 2025-11-02 (Monthly security review recommended)
