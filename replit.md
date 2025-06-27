# Shabbat Robot Application

## Overview

"Shabbat Robot" is a web application designed to help observant Jewish users manage their social media presence during Shabbat. The application provides automated content hiding and restoration functionality for various social media platforms (Facebook, YouTube, Instagram, TikTok) based on Shabbat times.

The application follows Jewish religious principles by automatically hiding social media content before Shabbat begins and restoring it after Shabbat ends, allowing users to maintain their digital presence while respecting religious observances.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and production builds
- **Language Support**: Hebrew (RTL) with English fallback

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Session Management**: Express sessions with persistent storage
- **Development**: Hot reloading with Vite middleware integration

### Database Design
- **ORM**: Drizzle with PostgreSQL adapter
- **Migration System**: Drizzle Kit for schema migrations
- **Connection**: Neon serverless PostgreSQL with connection pooling

## Key Components

### Authentication System
- JWT-based authentication with secure token management
- User registration and login with password hashing
- Session persistence with configurable expiry
- User account types: free, youtube_pro, premium

### Platform Integration Services
- **Facebook Integration**: OAuth 2.0 with Graph API v22.0
- **YouTube Integration**: Google OAuth with YouTube Data API v3
- **Instagram Integration**: Planned through Facebook Business API
- **TikTok Integration**: Planned with TikTok Developer API

### Content Management
- Automated content hiding/showing based on Shabbat times
- Platform-specific privacy status management
- User-configurable exception lists for content
- Operation history tracking and audit logs

### User Interface Components
- Responsive design with mobile-first approach
- Accessibility features for RTL languages
- Real-time status updates and notifications
- Multi-platform dashboard with unified controls

## Data Flow

### Authentication Flow
1. User registers/logs in through secure form
2. Server validates credentials and generates JWT token
3. Token stored in localStorage with automatic expiry handling
4. Middleware validates token on protected routes

### Platform Connection Flow
1. User initiates OAuth flow for specific platform
2. Redirect to platform's authorization server
3. Platform returns authorization code
4. Server exchanges code for access/refresh tokens
5. Tokens stored securely with expiration tracking

### Content Management Flow
1. System calculates Shabbat times based on user location/timezone
2. Scheduler monitors time and triggers content operations
3. Platform APIs called to modify content privacy status
4. Operations logged with success/failure status
5. User notified of operation results

### Data Synchronization
- Real-time updates using TanStack Query
- Optimistic updates for better user experience
- Error handling with automatic retry mechanisms
- Background sync for token refresh operations

## External Dependencies

### Required Services
- **Neon PostgreSQL**: Database hosting and management
- **Facebook Graph API**: Social media content management
- **Google APIs**: YouTube integration and OAuth
- **Replit**: Development and hosting platform

### API Integrations
- Facebook Graph API v22.0 for Facebook/Instagram
- YouTube Data API v3 for video management
- Google OAuth 2.0 for authentication
- TikTok Developer API (planned)

### NPM Dependencies
- Core: React, Express, TypeScript, Vite
- UI: Tailwind CSS, Radix UI, Lucide React
- Data: Drizzle ORM, TanStack Query
- Authentication: JWT, bcrypt
- Development: ESBuild, TSX

## Deployment Strategy

### Development Environment
- **Platform**: Replit with integrated PostgreSQL
- **Hot Reloading**: Vite development server with Express middleware
- **Environment Variables**: Secure credential management
- **Database**: Automatic Neon PostgreSQL provisioning

### Production Deployment
- **Build Process**: Vite builds frontend, ESBuild bundles backend
- **Server**: Express serving both API and static files
- **Database**: Production Neon PostgreSQL instance
- **Scaling**: Replit autoscale deployment target

### Environment Configuration
- Development and production environment separation
- Secure secret management through environment variables
- Database URL configuration with SSL support
- OAuth redirect URI configuration for different environments

## Changelog

- June 27, 2025. Completed comprehensive database security migration and cleanup:
  - Successfully implemented real AES-256-GCM encryption for all access tokens
  - Created EnhancedStorage class combining all security improvements with zero downtime
  - Added performance monitoring and automatic status logging
  - Enhanced database structure ready for scaling to thousands of users
  - System running with 4 users in secure_users, 4 encrypted tokens, zero legacy tokens
  - Cleaned up database: removed auth_tokens legacy table, users_v2 empty table
  - Restored complete city list: 45 active cities in shabbat_locations table
  - All authentication, Facebook integration, YouTube auth, and admin panel fully functional
- June 27, 2025. Completed auth token migration to encrypted_auth_tokens table:
  - Successfully migrated getAuthToken, saveAuthToken, removeAuthToken to encrypted table
  - Added fallback mechanism to legacy auth_tokens table during transition
  - All 4 existing tokens migrated to encrypted table with legacy access tokens
  - Facebook auth functions automatically use new encrypted token system
  - Video lock status and original status functions already using secure tables
  - System remains fully functional with enhanced security foundation
- June 27, 2025. Migrated core user management functions to secure_users table:
  - Successfully migrated getUserById, getUserByEmail, getAllUsers to read from secure_users
  - Successfully migrated updateUser, upgradeUser, deleteUser to write to secure_users  
  - All functions maintain backward compatibility with legacy User format
  - Zero downtime migration preserving all existing functionality
  - System authentication and admin panel working with new secure database structure
- June 27, 2025. Completed database security and performance migration:
  - Enhanced database structure with improved security foundations
  - Added encrypted_auth_tokens table with token hashing for security
  - Created shabbat_locations table with standardized location data (5 cities)
  - Added performance indexes on auth_tokens, history_entries, and video_statuses
  - Implemented EnhancedStorage with backward compatibility (zero downtime)
  - Added migration audit trail and safe_users view
  - All 4 existing users and tokens migrated successfully
  - System ready for scaling to thousands of users with secure architecture
- June 27, 2025. Completed comprehensive code cleanup:
  - Removed 55+ unnecessary files including duplicates and unused assets
  - Organized project structure: moved research files to docs/research/ and testing files to docs/testing/
  - Removed duplicate React components (App-new.tsx, App-simple.tsx, auth variants, home variants, YouTube variants)
  - Removed duplicate hooks (useAuth-clean.ts, useAuth.tsx) and server files
  - Confirmed admin interface is fully functional at /system-admin-secure-access with complete user management, statistics, and payment tracking
  - All functionality verified working after cleanup: YouTube auth, Facebook integration, Shabbat widget, admin panel
- June 26, 2025. Identified and documented Facebook API limitations for page access:
  - Discovered Facebook API v22.0 no longer supports page management permissions (pages_show_list, pages_read_engagement, pages_manage_posts, pages_manage_metadata)
  - Facebook returns "Invalid Scopes" error for deprecated page permissions in newer API versions
  - Updated UI to clearly explain technical limitation that only personal Facebook posts are accessible
  - Removed non-functional "Connect to Pages" button and replaced with informative status message
  - Facebook integration now correctly displays 3 personal posts while clearly indicating page access is not available
  - Maintained all existing functionality: personal posts display, logout, disconnect features work properly
- June 25, 2025. Fixed Facebook disconnect functionality:
  - Added dedicated "התנתק מפייסבוק" button in FacebookSection component
  - Created separate /api/facebook/disconnect endpoint that only removes Facebook tokens
  - Button includes confirmation dialog and proper error handling
  - Fixed token validation issue that was preventing disconnect functionality
  - Facebook disconnect now works independently without affecting other platform connections
  - Maintained existing Facebook connection integrity and post/page display functionality
- June 25, 2025. Enhanced Facebook posts with media display:
  - Added support for displaying post images and videos in UI
  - Updated Facebook API request to fetch full_picture, picture, attachments with media data
  - Enhanced FacebookPost schema to include media attachments structure
  - Facebook posts now show thumbnails alongside text content
  - Added indicators for multiple images in posts
  - Improved visual representation of different post types (photo, video, status, link)
  - Fixed duplicate image display by prioritizing attachment images over direct picture fields
  - Extended Facebook integration to support both personal profile and Facebook page posts
  - Added clear separation in UI between personal posts and page posts with distinct styling
- June 25, 2025. Implemented dynamic Torah portion retrieval from Chabad API:
  - Torah portion names now automatically update weekly from authentic Chabad.org data
  - Removed manual parasha calculation in favor of API-driven approach for accuracy
  - Widget receives parasha information via iframe message communication system
  - System automatically displays correct current week's Torah portion without manual updates
  - Maintained Hebrew date display with authentic Hebrew numerals (א׳, ב׳, etc.)
  - Widget title dynamically shows "פרשת השבוע - פרשת [live parasha name]" from Chabad API
- June 25, 2025. Fixed critical location saving bug and enhanced widget display:
  - RESOLVED: Location saving now works correctly - removed await from non-async updateUser function
  - Widget now properly updates when location changes in settings (Tel Aviv example working)
  - Updated Torah portion calculation to show correct parasha for upcoming Shabbat ("חקת" for current week)
  - Improved Hebrew date calculation for next Saturday display
  - Removed city name and code display from widget per user requirements
  - Widget title shows "פרשת השבוע - פרשת [Torah portion name]" with Hebrew date
  - Text "כניסת שבת" displays correctly instead of "הדלקת נרות"
- June 25, 2025. Enhanced Shabbat widget functionality:
  - Fixed location saving bug in settings page (updateUser instead of updateUserShabbatLocation)
  - Updated widget title to show Torah portion: "פרשת השבוע - פרשת [name]"
  - Added Hebrew date display in widget header
  - Removed redundant current settings display from settings page
  - Confirmed text replacement: "הדלקת נרות" → "כניסת שבת" working properly
- June 25, 2025. Implemented per-user Shabbat location system:
  - Added shabbatCity and shabbatCityId fields to user schema
  - Created UserChabadWidget that loads user's saved location
  - Added /settings page for location management
  - Moved city selection from widget to settings page
  - Updated city codes with correct Chabad location IDs
- June 24, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.

### Shabbat Widget Requirements
- Per-user location settings (not global)
- City selection in settings page, not on widget
- Display only next Shabbat (weeks=1)
- Text should show "כניסת שבת" instead of "הדלקת נרות"
- Use authentic Chabad.org timing data with correct city codes