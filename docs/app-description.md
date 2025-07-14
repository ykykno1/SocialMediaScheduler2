# Application Description for Google Verification

## App Name: רובוט שבת (Shabbat Robot)

### Brief Description:
A religious application that helps Jewish users manage their social media content during Sabbath and religious holidays by automatically hiding and restoring content on YouTube, Facebook, and Instagram platforms.

### Detailed Functionality:

**Core Purpose:**
Shabbat Robot serves the Jewish religious community by enabling observant users to maintain digital modesty during sacred times. The application automatically hides social media content before Sabbath/holidays and restores it afterward, allowing users to observe religious laws while preserving their digital presence.

**YouTube Integration:**
- **Scope**: `youtube.readonly` - Displays user's video list with current privacy status
- **Scope**: `youtube` - Changes video privacy (public ↔ private) for automated Shabbat management
- **Use Case**: Users can hide inappropriate or business content during sacred times while maintaining their channel

**Target Audience:**
- Orthodox and Conservative Jewish users
- Religious content creators and business owners
- Anyone seeking digital wellness aligned with religious observance

**Key Features:**
1. **Automatic Scheduling**: Based on accurate Shabbat times for user's location
2. **Manual Controls**: Immediate hide/restore functionality
3. **Content Protection**: Only user's own content is accessed
4. **Timing Preferences**: Customizable timing (15min-1hour before/after)
5. **Multi-Platform**: YouTube (active), Facebook, Instagram (planned)

**Religious Context:**
During Sabbath (Friday evening to Saturday evening), observant Jews refrain from work and digital activities. This application enables users to:
- Hide monetized YouTube videos (avoiding business activity)
- Hide content that might generate comments/engagement
- Maintain spiritual focus during sacred time
- Automatically restore content after Sabbath ends

**Technical Implementation:**
- Secure OAuth 2.0 authentication
- AES-256 encrypted token storage
- Timezone-aware scheduling
- GDPR/privacy compliant
- No data sharing with third parties

**Safety & Privacy:**
- Users retain full control over their content
- Transparent about all operations performed
- Can revoke access at any time
- Only accesses user's own accounts
- No permanent content deletion

**Business Model:**
- Freemium: YouTube-only free tier
- Premium: Multi-platform access ($9.90/month)
- Serves religious community, not profit-driven

### Why This Matters:
This application fills a genuine need in the Jewish religious community, enabling digital observance while respecting traditional values. It's a legitimate use case that benefits from automation to reduce manual work and ensure consistent religious practice.