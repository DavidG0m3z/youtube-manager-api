import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Video } from './entities/video.entity';
import { videosController } from './videos.controller';
import { VideosService } from './videos.service';
import { VideosRepository } from './videos.repository';

@Module({
    imports: [TypeOrmModule.forFeature([Video])],
    controllers: [videosController],
    providers: [VideosService, VideosRepository],
    exports: [TypeOrmModule]
})

export class VideosModule{}