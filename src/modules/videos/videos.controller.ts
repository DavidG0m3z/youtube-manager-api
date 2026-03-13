import {
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
} from '@nestjs/common'
import { VideosService } from './videos.service';
import { VideoResponseDto } from './dto/video-response.dto';

@Controller('videos')
export class videosController {

    constructor(
        private readonly videosService: VideosService
    ){}

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
    @HttpCode(HttpStatus.NO_CONTENT) // 204 — operación exitosa sin body
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
      return this.videosService.remove(id);
    }

}