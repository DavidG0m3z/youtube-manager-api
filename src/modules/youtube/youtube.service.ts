import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  YoutubeChannelResponseDto,
  YoutubePlaylistResponseDto,
  YoutubeVideoItemDto,
  YoutubeVideosResponseDto,
} from './dto/youtube-videos.dto';

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private readonly BASE_URL = 'https://www.googleapis.com/youtube/v3';
  private readonly apiKey: string;
  private readonly channelId: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.getOrThrow<string>('youtube.apiKey');
    this.channelId = this.configService.getOrThrow<string>('youtube.channelId');
  }

  async fetchAllVideos(authClient?: any): Promise<YoutubeVideoItemDto[]> {
    this.logger.log('Starting full channel sync...');

    let token: string | null = null;
    if (authClient && typeof authClient.getAccessToken === 'function') {
      const credentials = await authClient.getAccessToken();
      token = credentials.token;
      this.logger.log('Using Google OAuth token for synchronization');
    }

    console.log('Token: ', token);

    const uploadsPlaylistId = await this.getUploadsPlaylistId(token);
    this.logger.log(`Uploads playlist ID: ${uploadsPlaylistId}`);

    const videoIds = await this.getAllVideoIds(uploadsPlaylistId, token);
    this.logger.log(`Total videos found: ${videoIds.length}`);

    const videos = await this.getVideosDetails(videoIds, token);
    this.logger.log(`Videos fetched successfully: ${videos.length}`);

    return videos;
  }

  private async getUploadsPlaylistId(token: string | null): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<YoutubeChannelResponseDto>(
          `${this.BASE_URL}/channels`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            params: {
              part: 'contentDetails',
              id: this.channelId,
              ...(!token && { key: this.apiKey }),
            },
          },
        ),
      );

      const uploadsId =
        response.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

      if (!uploadsId) {
        throw new HttpException(
          'Uploads playlist not found. Check your YOUTUBE_CHANNEL_ID.',
          HttpStatus.NOT_FOUND,
        );
      }

      return uploadsId;
    } catch (error) {
      this.handleYoutubeError(error, 'getUploadsPlaylistId');
    }
  }

  private async getAllVideoIds(
    playlistId: string,
    token: string | null,
  ): Promise<string[]> {
    const videoIds: string[] = [];
    let nextPageToken: string | undefined = undefined;

    do {
      try {
        const response = await firstValueFrom(
          this.httpService.get<YoutubePlaylistResponseDto>(
            `${this.BASE_URL}/playlistItems`,
            {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              params: {
                part: 'snippet',
                playlistId,
                maxResults: 50,
                ...(!token && { key: this.apiKey }),
                ...(nextPageToken && { pageToken: nextPageToken }),
              },
            },
          ),
        );

        const ids = response.data.items.map(
          (item) => item.snippet.resourceId.videoId,
        );
        videoIds.push(...ids);

        nextPageToken = response.data.nextPageToken;
      } catch (error) {
        this.handleYoutubeError(error, 'getAllVideoIds');
      }
    } while (nextPageToken);

    return videoIds;
  }

  private async getVideosDetails(
    videoIds: string[],
    token: string | null,
  ): Promise<YoutubeVideoItemDto[]> {
    const chunks = this.chunkArray(videoIds, 50);
    const allVideos: YoutubeVideoItemDto[] = [];

    for (const chunk of chunks) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<YoutubeVideosResponseDto>(
            `${this.BASE_URL}/videos`,
            {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              params: {
                part: 'snippet,contentDetails',
                id: chunk.join(','),
                ...(!token && { key: this.apiKey }),
              },
            },
          ),
        );

        allVideos.push(...response.data.items);
      } catch (error) {
        this.handleYoutubeError(error, 'getVideosDetails');
      }
    }

    return allVideos;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private handleYoutubeError(error: any, context: string): never {
    if (error?.response?.data?.error) {
      const youtubeError = error.response.data.error;
      this.logger.error(
        `YouTube API error in ${context}: ${youtubeError.message}`,
      );
      throw new HttpException(
        `YouTube API error: ${youtubeError.message}`,
        error.response.status,
      );
    }

    if (error instanceof HttpException) {
      throw error;
    }

    this.logger.error(`Unexpected error in ${context}: ${error.message}`);
    throw new HttpException(
      'Unexpected error communicating with YouTube API',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
