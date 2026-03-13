import { Expose, Transform } from 'class-transformer';

export class VideoResponseDto {
  @Expose()
  id: number;

  @Expose()
  youtubeId: string;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  publicationDate: Date;

  @Expose()
  urlThumbnail: string;

  @Expose()
  tags: string[];

  @Expose()
  duration: string;

  @Expose()
  resolution: string;

  @Expose()
  orientation: string;

  @Expose()
  camera: string;

  @Expose()
  headquarters: string;

  @Expose()
  fps: number;

  @Expose()
  audiovisual: string;

  @Expose()
  colorProfile: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

}