# Google OAuth App Verification Guide - רובוט שבת

## סטטוס נוכחי
- **Domain**: robotshabat.com ✅
- **Privacy Policy**: /privacy-policy ✅  
- **Terms of Service**: /terms-of-service ✅
- **App Status**: In testing mode, needs verification
- **Client ID**: 351828412701-rt3ts08rsials5q7tmqr9prdjtu7qdke.apps.googleusercontent.com

## שלב 1: הכנת החומרים הנדרשים

### ✅ COMPLETED - Legal Pages
- **Privacy Policy**: https://robotshabat.com/privacy-policy
- **Terms of Service**: https://robotshabat.com/terms-of-service

### 📝 TODO - Demo Video
צריך ליצור סרטון הדגמה (1-2 דקות) שמראה:
1. התחברות ליוטיוב
2. צפייה ברשימת סרטונים  
3. פעולת הסתרה/שחזור ידנית
4. הגדרת זמנים אוטומטיים
5. פעולה אוטומטית (או הדמיה)

**רכיבי הסרטון:**
- התחלה: הסבר קצר על המטרה הדתית
- הדגמת OAuth flow ל-YouTube
- הצגת רשימת סרטונים
- הדגמת פעולות hide/restore
- הדגמת הגדרות אוטומטיות
- סיכום: איך זה עוזר לשמירת שבת

### 📝 TODO - App Description
**מה האפליקציה עושה:**
"רובוט שבת" הוא שירות המיועד לעזור למשתמשים יהודים שומרי מסורת לנהל את הנוכחות הדיגיטלית שלהם במהלך שבת וחגים. האפליקציה מתחברת לחשבונות YouTube, Facebook ואינסטגרם ומבצעת הסתרה אוטומטית של תוכן לפני שבת ושחזור לאחר צאת שבת.

**למה צריך YouTube API:**
- קריאת רשימת סרטונים של המשתמש (youtube.readonly)
- שינוי מצב פרטיות סרטונים מציבורי לפרטי ולהפך (youtube)
- שמירה על קדושת השבת על ידי הסתרת תוכן בזמן הדרוש

## שלב 2: Google Cloud Console Setup

### OAuth Consent Screen Configuration:
1. **App Information:**
   - App name: רובוט שבת (Shabbat Robot)
   - User support email: info@robotshabat.com
   - App logo: [קישור ללוגו באתר]

2. **App Domain:**
   - Application home page: https://robotshabat.com
   - Application privacy policy link: https://robotshabat.com/privacy-policy
   - Application terms of service link: https://robotshabat.com/terms-of-service

3. **Authorized Domains:**
   - robotshabat.com
   - social-media-scheduler-ykykyair.replit.app

4. **Scopes:**
   - ../auth/userinfo.email
   - ../auth/userinfo.profile  
   - ../auth/youtube.readonly
   - ../auth/youtube

### Domain Verification:
1. Google Search Console → Add Property → robotshabat.com
2. Verify ownership (DNS TXT record או HTML file)
3. Wait for verification confirmation

## שלב 3: Submission Materials

### Required Information:
1. **App Screenshot**: Screenshot של המסך הראשי
2. **Demo Video**: YouTube video מההדגמה שתוכן  
3. **Justification Text**:

```
Scope Justification - YouTube API Usage:

1. youtube.readonly:
   - Purpose: Display user's video list and current privacy status
   - Justification: Users need to see which videos will be affected by hide/restore operations
   - Religious context: Allows users to review content before Shabbat automation

2. youtube:
   - Purpose: Change video privacy status (public ↔ private) 
   - Justification: Core functionality for automatic Shabbat content management
   - Religious context: Enables hiding inappropriate content during Shabbat/holidays
   
The app serves the Jewish religious community by automating content management during sacred times, maintaining digital modesty while preserving user content.
```

### Supporting Documents:
1. **Business Information**: 
   - Developer: [Your Name/Company]
   - Contact: info@robotshabat.com
   - Location: Israel
   - Target audience: Jewish religious community

2. **User Safety**: 
   - Only accesses user's own content
   - No data sharing with third parties
   - Transparent about all operations
   - User can revoke access anytime

## שלב 4: Verification Process

### Timeline Expectations:
- **Brand Verification**: 2-3 business days
- **Security Review**: 2-4 weeks  
- **Full Approval**: Up to 6 weeks

### Common Rejection Reasons (to avoid):
- ❌ Incomplete privacy policy
- ❌ Demo video doesn't show actual API usage
- ❌ Scope justification too generic
- ❌ Domain not verified
- ❌ Missing terms of service

### After Submission:
1. Monitor Google Cloud Console for status updates
2. Respond promptly to any requests for clarification
3. Keep demo environment accessible for Google review
4. Document any changes requested by Google

## שלב 5: Production Readiness

### Pre-Launch Checklist:
- [ ] Verification approved
- [ ] All redirect URIs updated for production
- [ ] Domain fully configured (robotshabat.com)
- [ ] SSL certificate active
- [ ] Privacy policy accessible from domain
- [ ] Terms of service accessible from domain
- [ ] Error handling for OAuth failures
- [ ] User onboarding flow tested

### Post-Approval:
1. Update OAuth consent screen to "In production"
2. Monitor for any compliance issues
3. Prepare for annual re-verification
4. Document successful OAuth flow for users

## שלב 6: Alternative Approaches

### If Verification Delayed:
1. **Publish App without Verification**:
   - Users see warning screen but can proceed
   - Fully functional, just shows "unverified" warning
   - Good for initial user testing

2. **Add Test Users**:
   - Add specific emails to test users list
   - Up to 100 test users allowed
   - No warning screen for test users

### Risk Mitigation:
- Have fallback communication for users about warning screens
- Prepare user guide for navigating OAuth warnings
- Monitor for any policy changes from Google

## חומרים נוספים שיעזרו

### Email Templates:
**For Google Support (if needed):**
```
Subject: OAuth Verification Question - Shabbat Robot App

Hello,

I'm developing a religious application called "Shabbat Robot" (robotshabat.com) that helps Jewish users manage their social media content during Sabbath observance.

Our app requires YouTube API access to help users temporarily hide their video content during religious observance periods and restore it afterward. This serves an important religious function for our community.

[Specific question about verification process]

Best regards,
Shabbat Robot Team
Contact: info@robotshabat.com
Support: support@robotshabat.com
```

### Key Success Factors:
1. **Clear religious purpose** - Google generally approves faith-based applications
2. **Transparent functionality** - No hidden features or data collection
3. **Professional presentation** - Quality demo, clear documentation
4. **Responsive communication** - Quick responses to Google requests
5. **Authentic use case** - Real religious need, not just convenience

---

**Next Steps**: 
1. Create demo video
2. Set up domain verification  
3. Complete OAuth consent screen
4. Submit for verification
5. Monitor progress and respond to requests

**Estimated Timeline**: 2-3 weeks from submission to approval
**Success Probability**: High (clear use case, complete documentation, religious purpose)