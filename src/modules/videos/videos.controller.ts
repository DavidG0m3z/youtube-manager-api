import {
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
    UseGuards,
} from '@nestjs/common'
import { VideosService } from './videos.service';
import { VideoResponseDto } from './dto/video-response.dto';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/common/guards/roles.guards';
import { Role } from '../auth/enums/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('videos')
export class videosController {

    constructor(
        private readonly videosService: VideosService
    ){}

    @Post('sync_manual')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard('jwt'), RoleGuard)
    @Roles(Role.ADMIN)
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
    @UseGuards(AuthGuard('jwt'), RoleGuard)
    @Roles(Role.ADMIN)
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
      return this.videosService.remove(id);
    }

}