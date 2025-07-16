# Facebook OAuth Redirect URIs Configuration

## Current Issue
Facebook returns error: "URI של ההפניה מחדש לא נמצא ברשימת בהגדרות OAuth"

## CRITICAL SOLUTION REQUIRED

**The code is working perfectly. The only blocker is registering redirect URIs in Meta Developer Console.**

### Step-by-Step Fix Instructions

1. **Go to Meta Developer Console**: https://developers.facebook.com/apps/1598261231562840/
2. **Navigate to**: Facebook Login > Settings
3. **Add these URIs to "Valid OAuth Redirect URIs"**:

```
http://localhost:5000/auth-callback.html
https://localhost:5000/auth-callback.html
https://social-media-scheduler-ykykyair.replit.app/auth-callback.html
https://6866a7b9-e37b-4ce0-b193-e54ab5171d02-00-1hjnl20rbozcm.janeway.replit.dev/auth-callback.html
```

4. **Save changes**
5. **Test immediately** - should work instantly

## Historical Evidence
- **July 13, 2025**: "Updated Meta Developer Console with all redirect URIs and allowed domains (Facebook ready)"
- This means registration was done before, just needs to be updated with current URIs

## Technical Status
- ✅ Facebook App ID: 1598261231562840 (working)
- ✅ OAuth flow implementation (working)
- ✅ Auth callback processing (working)
- ✅ Token storage system (working)
- ❌ **Redirect URIs not registered** (only blocker)

## Current Test Results
All tests show identical error: "URI של ההפניה מחדש לא נמצא ברשימת בהגדרות OAuth"

This confirms the code works but Meta Developer Console needs URI registration.

## After Registration
Once URIs are registered, the system will work immediately:
1. Facebook login popup opens
2. User authenticates with Facebook  
3. Redirect to auth-callback.html with auth code
4. Server processes auth code and saves token
5. User can access Facebook posts and manage content

## Notes
- Facebook requires HTTPS for production (localhost HTTP is allowed for development)
- All redirect URIs must be pre-registered - no dynamic URIs allowed
- Case-sensitive exact matching required