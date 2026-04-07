import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  DefaultValuePipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { VideosService } from './videos.service';
import { VideoResponseDto } from './dto/video-response.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/common/guards/roles.guards';
import { Role } from '../auth/enums/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('videos')
@UseGuards(AuthGuard('jwt'))
export class videosController {
  constructor(private readonly videosService: VideosService) {}

  @Post('sync_manual')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Roles(Role.ADMIN)
  async syncManual(@Req() req): Promise<{ synced: number }> {
    return this.videosService.syncVideos(req.user.id);
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('resolution') resolution?: string,
    @Query('fps') fps?: string,
    @Query('headquarters') headquarters?: string,
    @Query('orientation') orientation?: string,
  ): Promise<{ data: VideoResponseDto[]; meta: any }> {
    const parsedFps = fps && !isNaN(parseInt(fps)) ? parseInt(fps) : undefined;

    return this.videosService.findAll(
      page,
      limit,
      search,
      resolution,
      parsedFps,
      headquarters,
      orientation,
    );
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

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Roles(Role.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVideoDto: UpdateVideoDto,
  ): Promise<VideoResponseDto> {
    return this.videosService.update(id, updateVideoDto);
  }
}
