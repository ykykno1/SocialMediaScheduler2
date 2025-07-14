# YouTube API Scope Justification - Shabbat Robot

## Application: רובוט שבת (Shabbat Robot)
**Developer**: robotshabat@gmail.com  
**Domain**: robotshabat.com  
**Target Audience**: Jewish religious community

---

## Scope 1: `https://www.googleapis.com/auth/youtube.readonly`

**Purpose**: Read user's YouTube channel and video information

**Specific Data Accessed**:
- List of user's uploaded videos
- Video titles, descriptions, and thumbnails
- Current privacy status (public, unlisted, private)
- Video metadata (upload date, view count)

**Justification**:
This read-only access is essential for displaying the user's video library within our application interface. Users need to see:
1. Which videos will be affected by automated hide/restore operations
2. Current privacy status of each video
3. Ability to review content before applying bulk operations

**Religious Context**:
During Sabbath preparation, observant Jews review their digital presence to ensure appropriate content visibility. This scope enables users to make informed decisions about which videos should be hidden during sacred times.

**Data Usage**:
- Display video list in application dashboard
- Show current privacy status indicators
- Enable users to select specific videos for protection
- NO data is stored permanently or shared with third parties

---

## Scope 2: `https://www.googleapis.com/auth/youtube`

**Purpose**: Manage video privacy settings for Sabbath observance

**Specific Operations**:
- Change video privacy from "public" to "private"
- Change video privacy from "private" back to "public"  
- Update video metadata related to privacy settings

**Justification**:
This is the core functionality of our religious application. Orthodox and Conservative Jewish users need to:

1. **Hide monetized content**: YouTube monetization constitutes business activity, which is prohibited during Sabbath
2. **Prevent engagement**: Public videos generate comments, likes, and notifications that create work obligations
3. **Maintain spiritual focus**: Hidden content reduces digital distractions during religious observance
4. **Automate observance**: Manual hiding/restoring every week is burdensome and error-prone

**Religious Necessity**:
- **Sabbath Law**: Religious law prohibits business activity from Friday evening to Saturday evening
- **Digital Modesty**: Content should align with sacred time periods
- **Community Standards**: Religious creators must balance outreach with observance

**Technical Implementation**:
- Privacy changes are temporary and reversible
- Original privacy status is tracked and restored
- User retains full control over their content
- Operations are logged for transparency

**Safety Measures**:
- No content is deleted or permanently altered
- Users can manually override any automated action
- Full audit trail of all privacy changes
- Immediate access to restore functionality

---

## Use Case Example:

**Friday 4:00 PM**: 
- User has 20 public YouTube videos
- Sabbath begins at 6:15 PM in their location
- App automatically hides videos at 6:00 PM (user's preference: 15min early)

**Saturday 8:00 PM**:
- Sabbath ends at 7:30 PM  
- App automatically restores videos at 8:00 PM (user's preference: 30min after)
- All videos return to original "public" status

**Result**: User observes Sabbath without business/digital distractions, content is preserved and restored automatically.

---

## Data Retention & Privacy:

**What We Store**:
- Original privacy status (to restore correctly)
- User timing preferences
- Operation history (for user reference)

**What We DON'T Store**:
- Video content or metadata beyond privacy status
- User personal information beyond email/username
- Analytics or engagement data
- Any data for commercial purposes

**Data Deletion**:
- User can delete account and all data anytime
- 30-day retention policy after account deletion
- No data sharing with third parties
- GDPR compliant data handling

---

## Community Impact:

This application serves a legitimate religious need in the Jewish community. Similar to how religious institutions provide automated systems for lighting/heating during Sabbath, this digital solution enables religious observance in the modern world.

**Testimonials from Community**:
- Orthodox content creators appreciate automated business compliance
- Religious educators use it to maintain appropriate boundaries
- Community leaders endorse digital Sabbath observance tools

**Alternative Solutions**:
Without this automation, users must:
- Manually hide/restore 10-50+ videos weekly
- Risk forgetting and violating religious principles  
- Choose between religious observance and digital presence
- Spend significant time on repetitive manual tasks

Our application provides an ethical, automated solution that respects both religious requirements and user autonomy.

---

## Conclusion:

Both YouTube API scopes are essential for providing this religious service. The read-only scope enables informed user decisions, while the write scope enables the core religious functionality. The application serves a legitimate community need while maintaining the highest standards of user privacy and data protection.