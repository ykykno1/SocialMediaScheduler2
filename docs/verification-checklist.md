# Google OAuth Verification Checklist - Shabbat Robot

## ✅ COMPLETED REQUIREMENTS

### Legal Documentation
- [x] **Privacy Policy**: https://robotshabat.com/privacy-policy
  - Comprehensive GDPR-compliant policy
  - Covers all data collection and usage
  - Explains YouTube API scope usage
  - Available in Hebrew (primary audience)

- [x] **Terms of Service**: https://robotshabat.com/terms-of-service  
  - Complete legal terms
  - User responsibilities and app limitations
  - Covers religious use case and data retention

### Domain Setup
- [x] **Primary Domain**: robotshabat.com
  - SSL certificate active
  - Professional landing page
  - Clear app description and functionality

- [x] **Authorized Domains**:
  - robotshabat.com ✅
  - social-media-scheduler-ykykyair.replit.app ✅

### OAuth Configuration  
- [x] **Client ID**: 351828412701-rt3ts08rsials5q7tmqr9prdjtu7qdke.apps.googleusercontent.com
- [x] **Redirect URIs**: Updated for both dev and production
- [x] **Scopes Requested**:
  - userinfo.email ✅
  - userinfo.profile ✅  
  - youtube.readonly ✅
  - youtube ✅

### Technical Implementation
- [x] **Working OAuth Flow**: YouTube authentication functional
- [x] **API Integration**: Successfully hiding/restoring videos
- [x] **Error Handling**: Proper OAuth error management
- [x] **Security**: AES-256 token encryption, HTTPS only

## 📝 TODO - VERIFICATION REQUIREMENTS

### 1. Domain Verification (CRITICAL)
- [ ] **Google Search Console Setup**:
  - Add robotshabat.com as property
  - Verify ownership via DNS TXT record or HTML file
  - Confirm verification status

### 2. Demo Video (REQUIRED)
**Content outline for 2-3 minute video**:
- [ ] Introduction: Religious purpose and community need
- [ ] User registration and YouTube OAuth flow
- [ ] Display of video list with privacy status  
- [ ] Manual hide/restore demonstration
- [ ] Automatic timing configuration
- [ ] Scheduler demonstration (simulated)
- [ ] User safety: disconnect and data control

**Technical requirements**:
- [ ] Screen recording in 1080p
- [ ] Clear audio narration (English recommended for Google)
- [ ] Show actual API calls and responses
- [ ] Upload to YouTube (public or unlisted)
- [ ] Include URL in verification submission

### 3. OAuth Consent Screen Completion
- [ ] **App Information**:
  - App name: רובוט שבת (Shabbat Robot)
  - App logo: Upload high-quality logo file
  - User support email: robotshabat@gmail.com

- [ ] **App Domain**:
  - Application home page: https://robotshabat.com
  - Application privacy policy: https://robotshabat.com/privacy-policy  
  - Application terms of service: https://robotshabat.com/terms-of-service

- [ ] **Developer Contact Information**:
  - Developer contact email
  - Physical address (if required)

### 4. Verification Submission Materials
- [ ] **Scope Justification**: docs/scope-justification.md (completed)
- [ ] **App Description**: docs/app-description.md (completed)
- [ ] **Screenshots**: 3-5 screenshots of key app screens
- [ ] **Demo Video URL**: Link to demonstration video

### 5. Additional Documentation
- [ ] **User Journey Documentation**: 
  - Step-by-step user flow from registration to automation
  - Clear explanation of religious use case
  - Before/after Sabbath workflow

- [ ] **Security Documentation**:
  - Data encryption methods
  - Token storage and expiration
  - User privacy protections

## 🚀 SUBMISSION PROCESS

### Step 1: Pre-Submission Checklist
- [ ] All legal pages accessible from domain
- [ ] Demo video uploaded and tested
- [ ] OAuth consent screen fully completed
- [ ] Domain verification confirmed
- [ ] All documentation prepared

### Step 2: Submit for Verification
1. [ ] Google Cloud Console → APIs & Services → OAuth consent screen
2. [ ] Click "Submit for Verification"  
3. [ ] Upload all required materials
4. [ ] Provide scope justifications
5. [ ] Submit demo video URL
6. [ ] Confirm contact information

### Step 3: Monitor Status
- [ ] Check Google Cloud Console daily for updates
- [ ] Respond promptly to any Google requests
- [ ] Document any feedback or required changes
- [ ] Update materials if requested

## 📋 ESTIMATED TIMELINE

### Phase 1: Preparation (1-2 days)
- Complete domain verification
- Create and upload demo video
- Finalize OAuth consent screen
- Prepare all documentation

### Phase 2: Submission (1 day)
- Submit verification request
- Upload all materials
- Confirm submission received

### Phase 3: Review Process (2-6 weeks)
- **Brand Verification**: 2-3 business days
- **Security Review**: 2-4 weeks
- **Final Approval**: Additional 1-2 weeks if requested

### Phase 4: Production Ready
- [ ] Update app status to "In production"
- [ ] Remove user limit (100 → unlimited)
- [ ] No more warning screens for users
- [ ] Full public availability

## 🎯 SUCCESS FACTORS

### High Priority for Approval:
- ✅ **Clear Religious Purpose**: Well-documented faith-based use case
- ✅ **Transparent Functionality**: No hidden features or data misuse
- ✅ **Professional Presentation**: Quality demo, complete documentation
- ✅ **Authentic Community Need**: Real religious requirement, not convenience
- ✅ **Security Compliance**: Proper data handling and user protections

### Risk Mitigation:
- Have alternative OAuth providers ready (if needed)
- Prepare user communication about temporary warning screens
- Document all Google interactions for future reference
- Maintain backup authentication methods

## 📞 SUPPORT CONTACTS

### If Issues Arise:
- **Google Cloud Support**: Available through console
- **Community Forums**: Google OAuth developer community
- **Documentation**: Official Google OAuth verification guides

### Escalation Path:
1. Google Cloud Console help section
2. Community support forums
3. Direct support ticket (paid plans)
4. Developer advocate contact (if available)

---

**Status**: Ready for domain verification and demo video creation
**Next Action**: Set up Google Search Console for domain verification
**Target Submission**: Within 2-3 days of completing TODO items