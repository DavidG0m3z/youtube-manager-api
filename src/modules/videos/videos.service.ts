import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { VideosRepository } from './videos.repository';
import { VideoResponseDto } from './dto/video-response.dto';
import { Video } from './entities/video.entity';

@Injectable()
export class VideosService {

    constructor(
        private readonly videosRepository: VideosRepository
    ){}

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