import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from './entities/video.entity';
import { promises } from "dns";

@Injectable()
export class VideosRepository {

    constructor( 
        @InjectRepository(Video)
        private readonly repository: Repository<Video>,
    ) {}

    async findAll(): Promise<Video[]> {
        return this.repository.find({
            where: { isActive: true },
            order: { publicationDate: 'DESC' }
        });
    }

    async findById (id: number): Promise<Video | null> {
        return this.repository.findOne({
            where: {
                id, 
                isActive: true
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

}