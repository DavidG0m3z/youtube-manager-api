import {
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
} from '@nestjs/common'
import { VideosService } from './videos.service';
import { VideoResponseDto } from './dto/video-response.dto';

@Controller('videos')
export class videosController {

    constructor(
        private readonly videosService: VideosService
    ){}

    @Post('sync_manual')
    @HttpCode(HttpStatus.OK)
    async syncManual(): Promise<{ synced: number }> {
        return this.videosService.syncVideos()
    }

    @Get()
    async findAll(): Promise<VideoResponseDto[]> {
      return this.videosService.findAll();
    }

    @Get(':id')
    async findOne(
      @Param('id', ParseIntPipe) id: number,
    ): Promise<VideoResponseDto> {
      return this.videosService.findById(id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
      return this.videosService.remove(id);
    }

}