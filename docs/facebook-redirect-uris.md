# Facebook OAuth Redirect URIs Configuration

## Current Issue
Facebook returns error: "URI של ההפניה מחדש לא נמצא ברשימת בהגדרות OAuth"

## Required Redirect URIs for Meta Developer Console

Based on our current setup, these URIs need to be registered in Meta Developer Console:

### Development URIs
- `https://localhost:5000/auth-callback.html` (current development)
- `http://localhost:5000/auth-callback.html` (HTTP fallback)

### Production URIs
- `https://social-media-scheduler-ykykyair.replit.app/auth-callback.html` (current production)
- `https://6866a7b9-e37b-4ce0-b193-e54ab5171d02-00-1hjnl20rbozcm.janeway.replit.dev/auth-callback.html` (current Replit dev domain)

### Historical URIs (from replit.md)
From July 13, 2025 documentation:
- `https://social-media-scheduler-ykykyair.replit.app/api/facebook/auth-callback` (old API endpoint)

## Steps to Fix

1. Go to Meta Developer Console: https://developers.facebook.com/apps/1598261231562840/
2. Navigate to Facebook Login > Settings
3. Add all the URIs above to "Valid OAuth Redirect URIs"
4. Save changes
5. Test authentication

## Current Test Results
- Facebook App ID: 1598261231562840
- Error: Redirect URI not whitelisted
- Current test URI: `https://localhost:5000/auth-callback.html`

## Notes
- Facebook requires HTTPS for all redirect URIs (except localhost HTTP for development)
- All redirect URIs must be pre-registered - no dynamic URIs allowed
- Case-sensitive matching