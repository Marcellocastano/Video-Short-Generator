import videoQueueService from '../../services/videoQueueService.js';
import db from '../../database/index.js';

describe('VideoQueueService', () => {
  beforeEach(async () => {
    // Pulisci il database prima di ogni test
    await db('videos').del();
  });

  afterAll(async () => {
    // Chiudi la connessione al database
    await db.destroy();
  });

  describe('addVideo', () => {
    it('should add a video successfully', async () => {
      const videoData = {
        title: 'Test Video',
        description: 'Test Description',
        filePath: '/path/to/video.mp4',
        publishAt: new Date().toISOString(),
        metadata: {
          hashtags: ['test'],
          privacy: 'private',
          language: 'it'
        }
      };

      const result = await videoQueueService.addVideo(videoData);
      expect(result[0]).toBeDefined();

      const savedVideo = await db('videos').where('id', result[0]).first();
      expect(savedVideo).toBeDefined();
      expect(savedVideo.title).toBe(videoData.title);
    });
  });

  describe('getVideoById', () => {
    it('should return null for non-existent video', async () => {
      const video = await videoQueueService.getVideoById(999);
      expect(video).toBeUndefined();
    });

    it('should return video for existing id', async () => {
      const videoData = {
        title: 'Test Video',
        description: 'Test Description',
        filePath: '/path/to/video.mp4',
        publishAt: new Date().toISOString(),
        metadata: {}
      };

      const [id] = await videoQueueService.addVideo(videoData);
      const video = await videoQueueService.getVideoById(id);
      
      expect(video).toBeDefined();
      expect(video.title).toBe(videoData.title);
    });
  });

  describe('getScheduledVideos', () => {
    it('should return only pending videos with past publish date', async () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      const futureDate = new Date(Date.now() + 1000000).toISOString();

      // Video passato
      await videoQueueService.addVideo({
        title: 'Past Video',
        filePath: '/test.mp4',
        publishAt: pastDate,
        metadata: {}
      });

      // Video futuro
      await videoQueueService.addVideo({
        title: 'Future Video',
        filePath: '/test.mp4',
        publishAt: futureDate,
        metadata: {}
      });

      const scheduledVideos = await videoQueueService.getScheduledVideos();
      expect(scheduledVideos).toHaveLength(1);
      expect(scheduledVideos[0].title).toBe('Past Video');
    });
  });

  describe('updateVideo', () => {
    it('should update video successfully', async () => {
      const [id] = await videoQueueService.addVideo({
        title: 'Original Title',
        filePath: '/test.mp4',
        metadata: {}
      });

      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
        metadata: { hashtags: ['updated'] }
      };

      await videoQueueService.updateVideo(id, updateData);
      const updated = await videoQueueService.getVideoById(id);

      expect(updated.title).toBe(updateData.title);
      expect(updated.description).toBe(updateData.description);
    });
  });

  describe('deleteVideo', () => {
    it('should delete video successfully', async () => {
      const [id] = await videoQueueService.addVideo({
        title: 'To Delete',
        filePath: '/test.mp4',
        metadata: {}
      });

      const result = await videoQueueService.deleteVideo(id);
      expect(result).toBe(1);

      const deleted = await videoQueueService.getVideoById(id);
      expect(deleted).toBeUndefined();
    });
  });
});
