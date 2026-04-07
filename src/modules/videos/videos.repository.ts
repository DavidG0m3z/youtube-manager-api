import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from './entities/video.entity';
import { promises } from 'dns';

@Injectable()
export class VideosRepository {
  constructor(
    @InjectRepository(Video)
    private readonly repository: Repository<Video>,
  ) {}

  async findAll(
    take: number = 12,
    skip: number = 0,
    search?: string,
    resolution?: string,
    fps?: number,
    headquarters?: string,
    orientation?: string,
  ): Promise<[Video[], number]> {
    const query = this.repository
      .createQueryBuilder('video')
      .where('video.isActive = :isActive', { isActive: true });

    if (search) {
      query.andWhere(
        '(video.title LIKE :search OR video.description LIKE :search OR video.tags LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (resolution) {
      // resolution is stored as simple-json array, so we can use LIKE
      query.andWhere('video.resolution LIKE :resolution', {
        resolution: `%${resolution}%`,
      });
    }

    if (fps) {
      query.andWhere('video.fps = :fps', { fps });
    }

    if (headquarters) {
      query.andWhere('video.headquarters = :hq', { hq: headquarters });
    }

    if (orientation) {
      query.andWhere('video.orientation = :orientation', { orientation });
    }

    query.orderBy('video.publicationDate', 'DESC').take(take).skip(skip);

    return query.getManyAndCount();
  }

  async findById(id: number): Promise<Video | null> {
    return this.repository.findOne({
      where: {
        id,
        isActive: true,
      },
    });
  }

  async findByYoutubeId(youtubeId: string): Promise<Video | null> {
    return this.repository.findOne({
      where: { youtubeId },
    });
  }

  async save(video: Partial<Video>): Promise<Video> {
    return this.repository.save(video);
  }

  async update(id: number, data: Partial<Video>): Promise<Video | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async softDelete(id: number): Promise<void> {
    await this.repository.update(id, { isActive: false });
  }

  async findDeletedYoutubeIds(): Promise<string[]> {
    const deletedVideos = await this.repository.find({
      where: { isActive: false },
      select: ['youtubeId'],
    });
    return deletedVideos.map((video) => video.youtubeId);
  }

  async upsert(videoData: Partial<Video>): Promise<void> {
    await this.repository.upsert(videoData, {
      conflictPaths: ['youtubeId'],
      skipUpdateIfNoValuesChanged: true,
    });
  }

  async upsertMany(videos: Partial<Video>[]): Promise<void> {
    if (videos.length === 0) return;

    await this.repository.upsert(videos, {
      conflictPaths: ['youtubeId'],
      skipUpdateIfNoValuesChanged: true,
    });
  }
}
