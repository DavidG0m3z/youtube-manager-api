import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { DownloaderService } from './downloader.service';

@Controller('downloader')
export class DownloaderController {
  constructor(private readonly downloaderService: DownloaderService) {}

  @Post('info')
  getVideoInfo(@Body() body: { url: string }) {
    if (!body?.url?.trim()) {
      throw new HttpException('URL vacía', HttpStatus.BAD_REQUEST);
    }
    return this.downloaderService.getVideoInfo(body.url.trim());
  }

  @Post('download')
  downloadVideo(@Body() body: { url: string; quality?: string }) {
    if (!body?.url?.trim()) {
      throw new HttpException('URL vacía', HttpStatus.BAD_REQUEST);
    }

    // Validar si es una URL de YouTube
    if (!body.url.includes('youtube.com') && !body.url.includes('youtu.be')) {
      throw new HttpException(
        'No es una URL de YouTube',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.downloaderService.startDownload(
      body.url.trim(),
      body.quality || 'best',
    );
  }

  @Get('status/:id')
  getStatus(@Param('id') id: string) {
    return this.downloaderService.getStatus(id);
  }

  @Get('file/:id')
  getFile(@Param('id') id: string, @Res() res: Response) {
    const status = this.downloaderService.getStatus(id);
    if (!status || status.status !== 'completed' || !status.filePath) {
      throw new HttpException(
        'Archivo no encontrado o descarga no completada',
        HttpStatus.NOT_FOUND,
      );
    }

    // Retorna el stream directamente como archivo descargable
    res.download(status.filePath, 'video_descargado.mp4', (err) => {
      if (err) {
        console.error('Error al enviar el archivo al cliente:', err);
      }
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const fs = require('fs');
        if (fs.existsSync(status.filePath)) {
          fs.unlinkSync(status.filePath);
        }
      } catch (e) {
        console.error('No se pudo borrar el archivo temporal:', e);
      }
    });
  }
}
