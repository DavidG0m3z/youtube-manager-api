import { YoutubeVideoItemDto } from "src/modules/youtube/dto/youtube-videos.dto";
import { Video } from "../entities/video.entity";

export class VideoMapper {

    static fromYoutube(youtubeVideo: YoutubeVideoItemDto): Partial<Video> {
        const { snippet, contentDetails } = youtubeVideo;

        const thumbnail = 
            snippet.thumbnails.high?.url ||
            snippet.thumbnails.medium?.url ||
            snippet.thumbnails.default?.url ||
            null;

        return {
          youtubeId: youtubeVideo.id,
          title: snippet.title,
          description: snippet.description || undefined,
          publicationDate: new Date(snippet.publishedAt),
          urlThumbnail: thumbnail || undefined,
          tags: snippet.tags || [],
          duration: contentDetails.duration, 
          lastSyncAt: new Date(),  
        };
    }
}