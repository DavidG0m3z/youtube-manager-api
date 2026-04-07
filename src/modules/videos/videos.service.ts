import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { VideosRepository } from './videos.repository';
import { VideoResponseDto } from './dto/video-response.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { Video } from './entities/video.entity';
import { VideoMapper } from './mapper/video.mapper';
import { YoutubeService } from '../youtube/youtube.service';
import { GoogleService } from '../google/google.service';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    private readonly videosRepository: VideosRepository,
    private readonly YoutubeService: YoutubeService,
    private readonly googleService: GoogleService,
  ) {}

  async syncVideos(userId: number): Promise<{ synced: number }> {
    this.logger.log(`Starting video sync for user ${userId}...`);

    let authClient: any = null;
    try {
      authClient = await this.googleService.getAuthorizedClient(userId);
    } catch (e) {
      this.logger.warn(
        `Could not get authorized client for user ${userId}: ${e.message}. Falling back to public API.`,
      );
    }

    const youtubeVideos = await this.YoutubeService.fetchAllVideos(authClient);

    const deleteYoutubeIds =
      await this.videosRepository.findDeletedYoutubeIds();

    const videosToSync = youtubeVideos
      .filter((ytVideo) => !deleteYoutubeIds.includes(ytVideo.id))
      .map((ytVideo) => VideoMapper.fromYoutube(ytVideo));

    this.logger.log(
      `Videos from YouTube: ${youtubeVideos.length} | ` +
        `Skipped (deleted locally): ${youtubeVideos.length - videosToSync.length} | ` +
        `To sync: ${videosToSync.length}`,
    );

    await this.videosRepository.upsertMany(videosToSync);

    this.logger.log(
      `Synn completed, videsos syncronicde: ${videosToSync.length}`,
    );

    return { synced: videosToSync.length };
  }

  async findAll(
    page: number = 1,
    limit: number = 12,
    search?: string,
    resolution?: string,
    fps?: number,
    headquarters?: string,
    orientation?: string,
  ): Promise<{ data: VideoResponseDto[]; meta: any }> {
    const skip = (page - 1) * limit;
    const [videos, total] = await this.videosRepository.findAll(
      limit,
      skip,
      search,
      resolution,
      fps,
      headquarters,
      orientation
    );

    return {
      data: this.mapToResponseDtoList(videos),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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

  async update(
    id: number,
    updateVideoDto: UpdateVideoDto,
  ): Promise<VideoResponseDto> {
    const video = await this.videosRepository.findById(id);

    if (!video) {
      throw new NotFoundException(`Video with id ${id} not found`);
    }

    const updatedVideo = await this.videosRepository.update(id, updateVideoDto);
    return this.mapToResponseDto(updatedVideo!);
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
