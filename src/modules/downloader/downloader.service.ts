import { Injectable, Logger } from '@nestjs/common';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import youtubedl from 'youtube-dl-exec';
import ffmpegLoc from 'ffmpeg-static';

@Injectable()
export class DownloaderService {
  private readonly logger = new Logger(DownloaderService.name);
  private downloadsStatus = new Map<string, any>();
  private readonly downloadFolder: string;

  constructor() {
    this.downloadFolder = path.join(
      os.homedir(),
      'Downloads',
      'YouTube_Videos',
    );
    if (!fs.existsSync(this.downloadFolder)) {
      fs.mkdirSync(this.downloadFolder, { recursive: true });
    }
  }

  private extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }

  async getVideoInfo(rawUrl: string): Promise<any> {
    const videoId = this.extractVideoId(rawUrl);
    if (!videoId) {
      return { success: false, error: 'URL inválida' };
    }

    // Asegurar que la URL tenga el protocolo para evitar errores de yt-dlp
    const url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    try {
      const options: any = {
        dumpJson: true,
        noWarnings: true,
        jsRuntimes: 'node',
      };

      if (fs.existsSync('youtube_cookies.txt')) {
        options.cookies = 'youtube_cookies.txt';
      }

      const videoInfo: any = await youtubedl(url, options);

      const title = videoInfo.title || 'Sin título';
      const duration = videoInfo.duration || 0;

      const formatDict: Record<number, boolean> = {};
      if (videoInfo.formats) {
        for (const fmt of videoInfo.formats) {
          if (fmt.vcodec !== 'none' && fmt.ext === 'mp4') {
            const height = fmt.height || 0;
            if (height >= 720) {
              formatDict[height] = true;
            }
          }
        }
      }

      const formats: { id: string; label: string; resolution: number }[] = [];
      if (formatDict[2160])
        formats.push({ id: 'best4k', label: '4K (2160p)', resolution: 2160 });
      if (formatDict[1440])
        formats.push({ id: 'best1440', label: '1440p (2K)', resolution: 1440 });
      if (formatDict[1080])
        formats.push({
          id: 'best1080',
          label: '1080p (Full HD)',
          resolution: 1080,
        });
      if (formatDict[720])
        formats.push({ id: 'best720', label: '720p (HD)', resolution: 720 });

      if (formats.length === 0) {
        formats.push({
          id: 'best',
          label: 'Mejor calidad disponible',
          resolution: 9999,
        });
      }

      return {
        success: true,
        title,
        thumbnail: thumbnailUrl,
        duration,
        formats,
      };
    } catch (e: any) {
      this.logger.error(`Error de youtubedl: ${e.message}`);
      return {
        success: false,
        error:
          'No se pudo obtener información del video o el enlace no es accesible',
      };
    }
  }

  startDownload(rawUrl: string, quality: string): any {
    const timestamp = new Date();
    const downloadId = `${timestamp.getFullYear()}${(timestamp.getMonth() + 1).toString().padStart(2, '0')}${timestamp.getDate().toString().padStart(2, '0')}_${timestamp.getHours().toString().padStart(2, '0')}${timestamp.getMinutes().toString().padStart(2, '0')}${timestamp.getSeconds().toString().padStart(2, '0')}`;

    this.downloadsStatus.set(downloadId, {
      status: 'downloading',
      progress: 0,
      message: 'Iniciando descarga...',
      folder: this.downloadFolder,
    });

    const url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

    // Iniciar descarga en background
    this.downloadWorker(url, quality, downloadId).catch((err) => {
      this.logger.error(`Unhandled error en worker: ${err.message}`);
    });

    return {
      success: true,
      message: 'Descarga iniciada',
      download_id: downloadId,
      folder: this.downloadFolder,
    };
  }

  private downloadWorker(url: string, quality: string, downloadId: string) {
    const formatMap: Record<string, string> = {
      best4k:
        'bestvideo[height<=2160][ext=mp4]+bestaudio[ext=m4a]/best[height<=2160]',
      best1440:
        'bestvideo[height<=1440][ext=mp4]+bestaudio[ext=m4a]/best[height<=1440]',
      best1080:
        'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080]',
      best720:
        'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720]',
      best: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    };

    const formatString = formatMap[quality] || formatMap['best'];

    const filePath = path.join(this.downloadFolder, `${downloadId}.mp4`);

    const args: any = {
      noCheckCertificates: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      f: formatString,
      mergeOutputFormat: 'mp4',
      o: filePath,
      newline: true,
      ffmpegLocation: ffmpegLoc,
      jsRuntimes: 'node',
    };

    this.downloadsStatus.set(downloadId, {
      ...this.downloadsStatus.get(downloadId),
      filePath: filePath,
    });

    if (fs.existsSync('youtube_cookies.txt')) {
      args.cookies = 'youtube_cookies.txt';
    }

    try {
      const child = youtubedl.exec(url, args);

      if (child.stdout) {
        child.stdout.on('data', (data: any) => {
          const output = data.toString();
          const lines = output.split('\n');

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            let progress = this.downloadsStatus.get(downloadId).progress;
            if (trimmed.includes('[download]') && trimmed.includes('%')) {
              const match = trimmed.match(/([\d.]+)%/);
              if (match && match[1]) {
                progress = parseFloat(match[1]);
              }
            }

            this.downloadsStatus.set(downloadId, {
              ...this.downloadsStatus.get(downloadId),
              progress,
              message: trimmed,
            });
          }
        });
      }

      if (child.stderr) {
        child.stderr.on('data', (data: any) => {
          this.logger.debug(`yt-dlp stderr: ${data.toString()}`);
        });
      }

      child.on('close', (code: number) => {
        if (code === 0) {
          this.downloadsStatus.set(downloadId, {
            ...this.downloadsStatus.get(downloadId),
            status: 'completed',
            progress: 100,
            message: '✅ Descarga completada',
            folder: this.downloadFolder,
          });
        } else {
          this.downloadsStatus.set(downloadId, {
            ...this.downloadsStatus.get(downloadId),
            status: 'error',
            progress: 0,
            message: `❌ Error en la descarga (código ${code})`,
          });
        }
      });

      child.on('error', (err: any) => {
        this.logger.error(`Error al lanzar youtubedl: ${err.message}`);
        this.downloadsStatus.set(downloadId, {
          ...this.downloadsStatus.get(downloadId),
          status: 'error',
          progress: 0,
          message: `❌ Error de sistema: no se pudo iniciar la descarga. (${err.message})`,
        });
      });
    } catch (e: any) {
      this.downloadsStatus.set(downloadId, {
        ...this.downloadsStatus.get(downloadId),
        status: 'error',
        progress: 0,
        message: `❌ Excepción: ${e.message}`,
      });
    }
  }

  getStatus(downloadId: string): any {
    const status = this.downloadsStatus.get(downloadId);
    if (!status) {
      return {
        status: 'unknown',
        progress: 0,
        message: 'Descarga no encontrada',
      };
    }
    return status;
  }
}
