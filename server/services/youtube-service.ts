import { google, youtube_v3 } from 'googleapis';
import type { PlatformToken } from '../../shared/types';

class YouTubeService {
  private oauth2Client: any;
  
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      // Dynamic redirect URI will be set per request
    );
  }

  getAuthUrl(redirectUri?: string): string {
    // Use the domain from the current request for redirect URI
    const actualRedirectUri = redirectUri || `${process.env.BASE_URL || 'https://localhost:5000'}/auth-callback.html`;
    
    this.oauth2Client.redirectUri = actualRedirectUri;

    const scopes = [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent' // Always request refresh token
    });
  }

  async exchangeCodeForTokens(code: string, redirectUri: string) {
    this.oauth2Client.redirectUri = redirectUri;
    
    const { tokens } = await this.oauth2Client.getToken(code);
    
    // Get channel information
    this.oauth2Client.setCredentials(tokens);
    const youtube = google.youtube({ version: 'v3', auth: this.oauth2Client });
    
    let channelTitle = 'Unknown Channel';
    try {
      const channelsResponse = await youtube.channels.list({
        part: ['snippet'],
        mine: true
      });
      
      if (channelsResponse.data.items && channelsResponse.data.items.length > 0) {
        channelTitle = channelsResponse.data.items[0].snippet?.title || 'Unknown Channel';
      }
    } catch (error) {
      console.warn('Could not fetch channel info:', error);
    }

    return {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      channelTitle
    };
  }

  async refreshToken(token: PlatformToken): Promise<PlatformToken> {
    this.oauth2Client.setCredentials({
      access_token: token.accessToken,
      refresh_token: token.refreshToken
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();
    
    return {
      ...token,
      accessToken: credentials.access_token!,
      expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined
    };
  }

  async getUserVideos(token: PlatformToken) {
    // Set up OAuth client with user's tokens
    this.oauth2Client.setCredentials({
      access_token: token.accessToken,
      refresh_token: token.refreshToken
    });

    const youtube = google.youtube({ version: 'v3', auth: this.oauth2Client });

    try {
      // Get user's channel
      const channelsResponse = await youtube.channels.list({
        part: ['contentDetails'],
        mine: true
      });

      if (!channelsResponse.data.items || channelsResponse.data.items.length === 0) {
        throw new Error('No YouTube channel found');
      }

      const uploadsPlaylistId = channelsResponse.data.items[0].contentDetails?.relatedPlaylists?.uploads;
      
      if (!uploadsPlaylistId) {
        throw new Error('Could not find uploads playlist');
      }

      // Get videos from uploads playlist
      const playlistResponse = await youtube.playlistItems.list({
        part: ['snippet', 'status'],
        playlistId: uploadsPlaylistId,
        maxResults: 50 // Can be made configurable
      });

      const videos = playlistResponse.data.items?.map(item => ({
        id: item.snippet?.resourceId?.videoId,
        title: item.snippet?.title,
        description: item.snippet?.description,
        publishedAt: item.snippet?.publishedAt,
        thumbnails: item.snippet?.thumbnails,
        privacyStatus: item.status?.privacyStatus,
        channelTitle: item.snippet?.channelTitle
      })) || [];

      return videos;

    } catch (error) {
      console.error('YouTube API error:', error);
      
      // If token expired, try to refresh
      if ((error as any).code === 401) {
        const refreshedToken = await this.refreshToken(token);
        // Retry with refreshed token
        return this.getUserVideos(refreshedToken);
      }
      
      throw error;
    }
  }

  async updateVideoVisibility(token: PlatformToken, videoId: string, action: 'hide' | 'show') {
    this.oauth2Client.setCredentials({
      access_token: token.accessToken,
      refresh_token: token.refreshToken
    });

    const youtube = google.youtube({ version: 'v3', auth: this.oauth2Client });

    try {
      // First get current video details
      const videoResponse = await youtube.videos.list({
        part: ['snippet', 'status'],
        id: [videoId]
      });

      if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
        throw new Error('Video not found');
      }

      const video = videoResponse.data.items[0];
      const currentPrivacyStatus = video.status?.privacyStatus;

      // Determine new privacy status
      let newPrivacyStatus: string;
      if (action === 'hide') {
        newPrivacyStatus = 'private';
      } else {
        // For restore, we need to know the original status
        // For now, default to 'public' - this could be improved by storing original status
        newPrivacyStatus = 'public';
      }

      // Update video privacy
      await youtube.videos.update({
        part: ['status'],
        requestBody: {
          id: videoId,
          status: {
            privacyStatus: newPrivacyStatus,
            embeddable: video.status?.embeddable,
            license: video.status?.license,
            publicStatsViewable: video.status?.publicStatsViewable,
            publishAt: video.status?.publishAt
          }
        }
      });

      return {
        success: true,
        videoId,
        action,
        previousStatus: currentPrivacyStatus,
        newStatus: newPrivacyStatus
      };

    } catch (error) {
      console.error('YouTube video update error:', error);
      
      // If token expired, try to refresh and retry
      if ((error as any).code === 401) {
        const refreshedToken = await this.refreshToken(token);
        return this.updateVideoVisibility(refreshedToken, videoId, action);
      }
      
      throw error;
    }
  }

  async bulkUpdateVideos(token: PlatformToken, videoIds: string[], action: 'hide' | 'show') {
    const results = [];
    
    for (const videoId of videoIds) {
      try {
        const result = await this.updateVideoVisibility(token, videoId, action);
        results.push(result);
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        results.push({
          success: false,
          videoId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  async testConnection(token: PlatformToken): Promise<boolean> {
    try {
      this.oauth2Client.setCredentials({
        access_token: token.accessToken,
        refresh_token: token.refreshToken
      });

      const youtube = google.youtube({ version: 'v3', auth: this.oauth2Client });
      
      // Simple test call
      await youtube.channels.list({
        part: ['snippet'],
        mine: true
      });

      return true;
    } catch (error) {
      console.error('YouTube connection test failed:', error);
      return false;
    }
  }
}

export const youtubeService = new YouTubeService();