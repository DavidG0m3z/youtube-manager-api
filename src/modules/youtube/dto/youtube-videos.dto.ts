export interface YoutubeChannelResponseDto {
  items: Array<{
    contentDetails: {
      relatedPlaylists: {
        uploads: string;
      };
    };
  }>;
}

export interface YoutubePlaylistResponseDto {
  nextPageToken?: string;
  items: Array<{
    snippet: {
      resourceId: {
        videoId: string;
      };
    };
  }>;
}

export interface YoutubeVideoItemDto {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
    tags?: string[];
  };
  contentDetails: {
    duration: string;
  };
}

export interface YoutubeVideosResponseDto {
  items: YoutubeVideoItemDto[];
}
