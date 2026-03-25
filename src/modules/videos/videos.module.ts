import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from './entities/video.entity';
import { videosController } from './videos.controller';
import { VideosService } from './videos.service';
import { VideosRepository } from './videos.repository';
import { YoutubeModule } from '../youtube/youtube.module';
import { GoogleModule } from '../google/google.module';

@Module({
  imports: [TypeOrmModule.forFeature([Video]), YoutubeModule, GoogleModule],
  controllers: [videosController],
  providers: [VideosService, VideosRepository],
  exports: [VideosService],
})
export class VideosModule {}
