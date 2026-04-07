// src/modules/videos/videos.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VideosService } from 'src/modules/videos/videos.service';
import { VideosRepository } from 'src/modules/videos/videos.repository';
import { YoutubeService } from 'src/modules/youtube/youtube.service';
import { Video } from 'src/modules/videos/entities/video.entity';

const mockVideosRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  softDelete: jest.fn(),
  upsertMany: jest.fn(),
  findDeletedYoutubeIds: jest.fn(),
};

const mockYoutubeService = {
  fetchAllVideos: jest.fn(),
};

const mockVideo: Video = {
  id: 1,
  youtubeId: 'abc123',
  title: 'Test Video',
  description: 'Test description',
  publicationDate: new Date('2024-01-01'),
  urlThumbnail: 'https://thumbnail.url',
  tags: ['tag1'],
  duration: 'PT5M',
  resolution: null as unknown as string,
  orientation: null as unknown as string,
  camera: null as unknown as string,
  headquarters: null as unknown as string,
  fps: null as unknown as number,
  audiovisual: null as unknown as string,
  colorProfile: null as unknown as string,
  lastSyncAt: new Date(),
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('VideosService', () => {
  let service: VideosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideosService,
        { provide: VideosRepository, useValue: mockVideosRepository },
        { provide: YoutubeService, useValue: mockYoutubeService },
      ],
    }).compile();

    service = module.get<VideosService>(VideosService);

    jest.clearAllMocks();
  });

  // ─── findAll ──── //

  describe('findAll', () => {
    it('should return a list of mapped videos', async () => {
      mockVideosRepository.findAll.mockResolvedValue([mockVideo]);

      const result = await service.findAll();

      expect(mockVideosRepository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockVideo.id);
      expect(result[0].title).toBe(mockVideo.title);
      expect(result[0]).not.toHaveProperty('isActive');
      expect(result[0]).not.toHaveProperty('lastSyncAt');
      expect(result[0]).not.toHaveProperty('passwordHash');
    });

    it('should return empty array when no videos exist', async () => {
      mockVideosRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ─── findById ────//

  describe('findById', () => {
    it('should return a video when it exists', async () => {
      mockVideosRepository.findById.mockResolvedValue(mockVideo);

      const result = await service.findById(1);

      expect(mockVideosRepository.findById).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
      expect(result.title).toBe('Test Video');
    });

    it('should throw NotFoundException when video does not exist', async () => {
      mockVideosRepository.findById.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
      await expect(service.findById(999)).rejects.toThrow(
        'Video with id 999 not found',
      );
    });
  });

  // ─── remove ─────//

  describe('remove', () => {
    it('should soft delete a video when it exists', async () => {
      mockVideosRepository.findById.mockResolvedValue(mockVideo);
      mockVideosRepository.softDelete.mockResolvedValue(undefined);

      await service.remove(1);

      expect(mockVideosRepository.findById).toHaveBeenCalledWith(1);
      expect(mockVideosRepository.softDelete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when video does not exist', async () => {
      mockVideosRepository.findById.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);

      expect(mockVideosRepository.softDelete).not.toHaveBeenCalled();
    });
  });

  // ─── syncVideos ──── //

  describe('syncVideos', () => {
    const mockYoutubeVideos = [
      {
        id: 'yt1',
        snippet: {
          title: 'Video 1',
          description: '',
          publishedAt: '2024-01-01T00:00:00Z',
          thumbnails: { high: { url: 'https://thumb1.jpg' } },
          tags: [],
        },
        contentDetails: { duration: 'PT5M' },
      },
      {
        id: 'yt2', 
        snippet: {
          title: 'Video 2',
          description: '',
          publishedAt: '2024-01-02T00:00:00Z',
          thumbnails: { high: { url: 'https://thumb2.jpg' } },
          tags: [],
        },
        contentDetails: { duration: 'PT3M' },
      },
    ];

    it('should sync videos and skip locally deleted ones', async () => {
      mockYoutubeService.fetchAllVideos.mockResolvedValue(mockYoutubeVideos);
      mockVideosRepository.findDeletedYoutubeIds.mockResolvedValue(['yt2']);
      mockVideosRepository.upsertMany.mockResolvedValue(undefined);

      const result = await service.syncVideos();

      expect(result.synced).toBe(1);
      expect(mockVideosRepository.upsertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ youtubeId: 'yt1' }),
        ]),
      );

      expect(mockVideosRepository.upsertMany).not.toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ youtubeId: 'yt2' }),
        ]),
      );
    });

    it('should sync all videos when none are deleted locally', async () => {
      mockYoutubeService.fetchAllVideos.mockResolvedValue(mockYoutubeVideos);
      mockVideosRepository.findDeletedYoutubeIds.mockResolvedValue([]);
      mockVideosRepository.upsertMany.mockResolvedValue(undefined);

      const result = await service.syncVideos();

      expect(result.synced).toBe(2);
    });
  });
});