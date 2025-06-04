import { secureStorage } from "../storage-new";

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  privacyStatus: 'public' | 'private' | 'unlisted';
  viewCount?: string;
  likeCount?: string;
}

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount?: string;
  videoCount?: string;
}

export class YouTubeService {
  private readonly apiKey: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || '';
    this.clientId = process.env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  }

  /**
   * Get OAuth URL for YouTube authentication
   */
  getAuthUrl(userId: string, redirectUri: string): string {
    if (!this.clientId) {
      throw new Error('Google Client ID not configured');
    }

    const scopes = [
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.force-ssl'
    ].join(' ');

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      state: userId // Include user ID for security
    });

    return `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Get user's YouTube channel information
   */
  async getChannelInfo(accessToken: string): Promise<YouTubeChannel> {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get channel info: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      throw new Error('No YouTube channel found for this account');
    }

    const channel = data.items[0];
    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnailUrl: channel.snippet.thumbnails.default.url,
      subscriberCount: channel.statistics?.subscriberCount,
      videoCount: channel.statistics?.videoCount,
    };
  }

  /**
   * Get user's YouTube videos
   */
  async getUserVideos(accessToken: string, maxResults: number = 50): Promise<YouTubeVideo[]> {
    // First get the channel's uploads playlist
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!channelResponse.ok) {
      throw new Error(`Failed to get channel: ${channelResponse.statusText}`);
    }

    const channelData = await channelResponse.json();
    const uploadsPlaylistId = channelData.items[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      return [];
    }

    // Get videos from uploads playlist
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!videosResponse.ok) {
      throw new Error(`Failed to get videos: ${videosResponse.statusText}`);
    }

    const videosData = await videosResponse.json();
    const videoIds = videosData.items.map((item: any) => item.snippet.resourceId.videoId).join(',');

    // Get detailed video information
    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,status,statistics&id=${videoIds}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!detailsResponse.ok) {
      throw new Error(`Failed to get video details: ${detailsResponse.statusText}`);
    }

    const detailsData = await detailsResponse.json();

    return detailsData.items.map((video: any) => ({
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnailUrl: video.snippet.thumbnails.default.url,
      publishedAt: video.snippet.publishedAt,
      privacyStatus: video.status.privacyStatus,
      viewCount: video.statistics?.viewCount,
      likeCount: video.statistics?.likeCount,
    }));
  }

  /**
   * Update video visibility (privacy status)
   */
  async updateVideoVisibility(
    accessToken: string, 
    videoId: string, 
    privacyStatus: 'public' | 'private' | 'unlisted'
  ): Promise<void> {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=status`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: videoId,
          status: {
            privacyStatus: privacyStatus,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update video visibility: ${error}`);
    }
  }

  /**
   * Hide videos (make them private)
   */
  async hideVideos(userId: string, videoIds: string[]): Promise<void> {
    const user = secureStorage.getUserById(userId);
    if (!user || !user.youtubeAccessToken) {
      throw new Error('User not connected to YouTube');
    }

    for (const videoId of videoIds) {
      await this.updateVideoVisibility(user.youtubeAccessToken, videoId, 'private');
    }
  }

  /**
   * Restore videos (make them public)
   */
  async restoreVideos(userId: string, videoIds: string[]): Promise<void> {
    const user = secureStorage.getUserById(userId);
    if (!user || !user.youtubeAccessToken) {
      throw new Error('User not connected to YouTube');
    }

    for (const videoId of videoIds) {
      await this.updateVideoVisibility(user.youtubeAccessToken, videoId, 'public');
    }
  }

  /**
   * Test YouTube connection
   */
  async testConnection(accessToken: string): Promise<boolean> {
    try {
      await this.getChannelInfo(accessToken);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const youtubeService = new YouTubeService();