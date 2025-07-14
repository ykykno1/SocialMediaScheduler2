# Google OAuth Consent Screen Configuration

## Project: Shabbat Robot
**Client ID**: 351828412701-rt3ts08rsials5q7tmqr9prdjtu7qdke.apps.googleusercontent.com

---

## OAuth Consent Screen Setup

### 1. App Information
```
App name: רובוט שבת (Shabbat Robot)
App logo: [Upload logo file - see logo specs below]
User support email: robotshabat@gmail.com
```

### 2. App Domain
```
Application home page: https://robotshabat.com
Application privacy policy link: https://robotshabat.com/privacy-policy
Application terms of service link: https://robotshabat.com/terms-of-service
```

### 3. Authorized Domains
```
robotshabat.com
social-media-scheduler-ykykyair.replit.app
```

### 4. Developer Contact Information
```
Email address: robotshabat@gmail.com
```

---

## Scopes Configuration

### Requested Scopes:
1. **../auth/userinfo.email**
   - Justification: User authentication and account management
   
2. **../auth/userinfo.profile**
   - Justification: Basic user identification
   
3. **../auth/youtube.readonly**
   - Justification: Display user's video list and privacy status for religious content review
   
4. **../auth/youtube**
   - Justification: Manage video privacy (public ↔ private) for automated Sabbath observance

---

## App Logo Specifications

### Requirements:
- **Size**: 120x120 pixels (PNG or JPG)
- **Background**: Transparent or white
- **Content**: Simple, clear representation
- **Text**: Minimal, readable at small sizes

### Suggested Logo Elements:
- Hebrew text: "רובוט שבת"
- Simple robot or automation icon
- Religious symbols (optional): Star of David, Sabbath candles
- Colors: Blue, white, gold (traditional Jewish colors)

### Logo Creation Options:
1. **Text-based**: Simple Hebrew text on clean background
2. **Icon + Text**: Robot icon with Hebrew text
3. **Symbol**: Stylized Sabbath candles with modern touch

---

## App Description for OAuth Screen

### Short Description (appears on consent screen):
```
Helps Jewish users manage social media content during Sabbath observance by automatically hiding and restoring videos based on religious timing.
```

### Detailed Description (for review):
```
Shabbat Robot serves the Jewish religious community by enabling automatic content management during sacred times. The application helps observant users maintain religious compliance while preserving their digital presence.

Core functionality:
- Displays user's YouTube videos with privacy status
- Enables temporary hiding of content during Sabbath/holidays
- Automatically restores content after religious observance periods
- Provides timing customization based on user preferences

Religious context:
During Sabbath (Friday evening to Saturday evening), observant Jews refrain from business activities and digital engagement. This app automates the process of making YouTube videos private during these times and public afterward, ensuring religious compliance without permanent content loss.

The application only accesses the user's own content, never shares data with third parties, and maintains full user control over all operations.
```

---

## Verification Submission Materials

### 1. App Screenshots (3-5 required):
- [ ] **Landing page**: Shows app purpose and features
- [ ] **YouTube connection**: OAuth flow in action
- [ ] **Video dashboard**: List of videos with privacy status
- [ ] **Settings page**: Timing preferences and location selection
- [ ] **Automation display**: Scheduled operations and countdown

### 2. Demo Video:
- [ ] **URL**: [To be provided after upload]
- [ ] **Duration**: 2-3 minutes
- [ ] **Content**: Complete user flow from registration to automation

### 3. Scope Justification Document:
- [ ] **File**: docs/scope-justification.md ✅
- [ ] **Content**: Detailed explanation of YouTube API usage

---

## Verification Process Checklist

### Pre-Submission:
- [ ] Domain verified in Google Search Console ✅
- [ ] All legal pages accessible and complete ✅
- [ ] OAuth consent screen fully configured
- [ ] Demo video recorded and uploaded
- [ ] App screenshots captured
- [ ] All documentation prepared ✅

### Submission:
- [ ] Navigate to Google Cloud Console
- [ ] APIs & Services → OAuth consent screen
- [ ] Click "Submit for Verification"
- [ ] Upload all required materials
- [ ] Submit scope justifications
- [ ] Provide demo video URL

### Post-Submission:
- [ ] Monitor Google Cloud Console for status updates
- [ ] Respond promptly to any requests from Google
- [ ] Keep demo environment accessible
- [ ] Document any feedback received

---

## Common Approval Factors

### Positive Indicators:
✅ **Clear religious purpose** - Well-documented faith-based use case  
✅ **Transparent functionality** - No hidden features or data misuse  
✅ **Professional presentation** - Quality demo and documentation  
✅ **Authentic community need** - Real religious requirement  
✅ **Security compliance** - Proper data handling and user protection  

### Risk Mitigation:
- Emphasize temporary/reversible nature of privacy changes
- Highlight user control and transparency
- Document religious necessity clearly
- Show active user community (if available)
- Maintain professional communication

---

## Expected Timeline

### Verification Stages:
1. **Brand Verification**: 2-3 business days
2. **Security Review**: 2-4 weeks
3. **Scope Review**: 1-2 weeks
4. **Final Approval**: Additional 1-2 weeks if needed

### Status Monitoring:
- Check Google Cloud Console daily
- Email notifications for status changes
- Respond within 24-48 hours to any requests

---

## Success Criteria

### Approval Indicators:
- Status changes to "Verified"
- User limit removed (no longer 100 users max)
- No warning screen for new users
- Full production availability

### If Approved:
- Update app status to "In production"
- Remove test user limitations
- Monitor for compliance issues
- Prepare for annual re-verification

### If Additional Information Requested:
- Respond quickly with requested materials
- Clarify any technical questions
- Provide additional demos if needed
- Maintain professional communication