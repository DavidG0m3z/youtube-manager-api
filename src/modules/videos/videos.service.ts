import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { VideosRepository } from './videos.repository';
import { VideoResponseDto } from './dto/video-response.dto';
import { Video } from './entities/video.entity';
import { VideoMapper } from './mapper/video.mapper';
import { YoutubeService } from '../youtube/youtube.service';

@Injectable()
export class VideosService {

    private readonly logger = new Logger(VideosService.name);

    constructor(
        private readonly videosRepository: VideosRepository,
        private readonly YoutubeService: YoutubeService
    ){}

    async syncVideos(): Promise<{synced: number}>{
        this.logger.log('Starting video sync...')

        const youtubeVideos = await this.YoutubeService.fetchAllVideos();

        const deleteYoutubeIds = await this.videosRepository.findDeletedYoutubeIdes();

        const videosToSync = youtubeVideos
            .filter((ytVideo) => !deleteYoutubeIds.includes(ytVideo.id))
            .map((ytVideo) => VideoMapper.fromYoutube(ytVideo),
        );

        this.logger.log(
          `Videos from YouTube: ${youtubeVideos.length} | ` +
          `Skipped (deleted locally): ${youtubeVideos.length - videosToSync.length} | ` +
          `To sync: ${videosToSync.length}`
        );

        await this.videosRepository.upsertMany(videosToSync);
        
        this.logger.log(`Synn completed, videsos syncronicde: ${videosToSync.length}`);

        return { synced: videosToSync.length };
    }

    async findAll(): Promise<VideoResponseDto[]> {
        const videos = await this.videosRepository.findAll();
        return this.mapToResponseDtoList(videos);
    }

    async findById(id: number): Promise<VideoResponseDto> {
      const video = await this.videosRepository.findById(id);

      if (!video) {
        throw new NotFoundException(`Video with id ${id} not found`);
      }

      return this.mapToResponseDto(video);
    }

    async remove(id: number): Promise<void> {
      const video = await this.videosRepository.findById(id);

      if (!video) {
        throw new NotFoundException(`Video with id ${id} not found`);
      }

      await this.videosRepository.softDelete(id);
    }

    
    //---Metodos de mapeo--//
    private mapToResponseDto(video: Video): VideoResponseDto {
        return plainToInstance(VideoResponseDto, video, {
            excludeExtraneousValues: true,
        });
    }

    private mapToResponseDtoList(videos: Video[]): VideoResponseDto[] {
        return videos.map((video) => this.mapToResponseDto(video));
    }
}