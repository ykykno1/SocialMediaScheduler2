# Email Service Troubleshooting Guide

## Current Status

**Email Configuration:**
- Host: smtp.zoho.com
- Port: 465 (SSL)
- User: no-reply@robotshabat.com
- From: no-reply@robotshabat.com

**Issue:** Authentication failed (535 Authentication Failed)

## Troubleshooting Steps for Zoho Mail

### 1. Enable IMAP/SMTP Access
1. Login to Zoho Mail
2. Go to Settings → Mail Accounts
3. Enable IMAP/SMTP access
4. Save changes

### 2. Use App Password (Recommended)
If 2FA is enabled on your Zoho account:
1. Go to Zoho Account Settings
2. Navigate to Security → App Passwords
3. Create a new App Password for "Email Application"
4. Use this App Password instead of your regular password

### 3. Check Security Settings
1. Ensure "Less secure app access" is enabled (if available)
2. Check if your account has any IP restrictions
3. Verify that SMTP is not blocked by your organization

### 4. Alternative SMTP Settings
Try these alternative settings:
```
Host: smtp.zoho.com
Port: 587 (TLS)
Secure: false (use STARTTLS)
```

## Current System Impact

**✅ No Impact on Core Functionality:**
- User authentication works normally
- YouTube OAuth integration functional
- Facebook integration operational
- Automatic Shabbat scheduler running
- All core features available

**⚠️ Affected Features:**
- Email verification for new users
- Password reset emails
- System notifications

## Workaround Solution

For immediate Google OAuth verification submission, the email service is **not required**. The system can proceed with:

1. **User Registration:** Works with password-based authentication
2. **OAuth Integration:** Fully functional for YouTube/Facebook
3. **Core Features:** All content management features operational
4. **Google Verification:** Can be submitted without email service

## Next Steps

1. **Immediate:** Proceed with Google OAuth verification (email not required)
2. **Short-term:** Resolve email authentication with Zoho settings
3. **Long-term:** Consider alternative email providers if needed

## Alternative Email Providers

If Zoho continues to have issues, consider:
- **Gmail:** Requires App Password with 2FA
- **Outlook/Hotmail:** Generally reliable SMTP
- **SendGrid:** Professional email service
- **Amazon SES:** AWS email service

## Technical Notes

The email service is initialized but fails authentication. The application gracefully handles this by:
- Logging the error without crashing
- Continuing with all other services
- Providing fallback for email-dependent features

**System remains fully operational for Google OAuth verification submission.**