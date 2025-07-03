# Replit.md - "Shabbat Robot" Project

## Overview

"Shabbat Robot" is a full-stack web application designed to help Orthodox Jewish users automatically hide their social media content during Shabbat hours. The application connects to YouTube and Facebook APIs to temporarily make content private during Jewish Sabbath times, then automatically restores it afterward.

## System Architecture

### Technology Stack
- **Frontend**: React with TypeScript, Vite, TailwindCSS
- **Backend**: Node.js with Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: Shadcn/ui (styled with Radix UI)
- **Authentication**: JWT-based authentication with OAuth 2.0 for social platforms
- **Deployment**: Configured for Replit environment

### Architectural Pattern
The application follows a monorepo structure with shared TypeScript schemas and types:
- `client/` - React frontend application
- `server/` - Express.js backend API
- `shared/` - Common TypeScript types and schemas
- `docs/` - Research documentation and API integration guides

## Key Components

### Frontend Components (`client/src/components/`)
- **Dashboard**: Main application interface showing platform connections
- **YouTubeAuth**: OAuth authentication flow for YouTube
- **FacebookSection**: Facebook integration and post management
- **UnifiedSettings**: City selection and Shabbat timing configuration
- **History**: Activity logging and operation history

### Backend Services (`server/`)
- **Authentication**: JWT-based user authentication with session management
- **Database Storage**: Drizzle ORM with PostgreSQL for user data, tokens, and history
- **OAuth Integration**: Google OAuth 2.0 for YouTube, Facebook SDK integration
- **Automatic Scheduler**: Cron-based system for Shabbat-time content management
- **Encryption**: Token encryption for secure storage of OAuth credentials

### Database Schema (`shared/schema.ts`)
- **Users**: User accounts with subscription tiers (free, premium)
- **Auth Tokens**: Encrypted OAuth tokens for social platforms
- **History Entries**: Activity logging for hide/restore operations
- **Video/Content Status**: Track privacy state changes

## Data Flow

1. **User Registration/Login**: JWT-based authentication with secure password hashing
2. **Platform Connection**: OAuth flows for YouTube and Facebook with token encryption
3. **Content Management**: API calls to hide/restore content privacy settings
4. **Scheduling**: Automatic Shabbat time calculation based on user's city
5. **History Tracking**: Log all operations for user visibility and debugging

## External Dependencies

### APIs and Services
- **YouTube Data API v3**: Video privacy management
- **Facebook Graph API**: Post and page privacy management
- **Chabad.org API**: Shabbat time calculations for various cities
- **Google OAuth 2.0**: YouTube authentication
- **Facebook Login**: Facebook authentication

### Key Libraries
- **@tanstack/react-query**: Server state management
- **drizzle-orm**: Database ORM with PostgreSQL
- **@neondatabase/serverless**: PostgreSQL connection
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT token management
- **node-cron**: Scheduled task management

## Deployment Strategy

### Environment Configuration
- **Development**: Local development with hot reload via Vite
- **Production**: Replit deployment with environment variables
- **Database**: PostgreSQL via Neon (serverless PostgreSQL)

### Build Process
- Frontend: Vite build with TypeScript compilation
- Backend: ESBuild bundling for Node.js deployment
- Database: Drizzle migrations for schema management

### Security Considerations
- OAuth tokens encrypted before database storage
- JWT tokens for session management
- HTTPS required for OAuth callbacks
- Environment variables for sensitive configuration

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- July 03, 2025. Initial setup