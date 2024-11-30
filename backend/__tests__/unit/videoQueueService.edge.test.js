import videoQueueService from '../../services/videoQueueService.js';
import db from '../../database/index.js';

describe('VideoQueueService Edge Cases', () => {
  beforeEach(async () => {
    await db('videos').del();
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('addVideo edge cases', () => {
    it('should handle very long title and description', async () => {
      const longTitle = 'a'.repeat(100);
      const longDescription = 'b'.repeat(5000);
      
      const result = await videoQueueService.addVideo({
        title: longTitle,
        description: longDescription,
        filePath: '/test.mp4',
        metadata: {}
      });

      const video = await videoQueueService.getVideoById(result[0]);
      expect(video.title).toBe(longTitle);
      expect(video.description).toBe(longDescription);
    });

    it('should handle special characters in metadata', async () => {
      const metadata = {
        hashtags: ['test#1', 'test@2', 'test&3'],
        emoji: '🎥🎬🎦',
        specialChars: '!@#$%^&*()',
        nestedObject: {
          deep: {
            deeper: {
              value: 'test'
            }
          }
        }
      };

      const result = await videoQueueService.addVideo({
        title: 'Test Video',
        filePath: '/test.mp4',
        metadata
      });

      const video = await videoQueueService.getVideoById(result[0]);
      expect(JSON.parse(video.metadata)).toEqual(metadata);
    });

    it('should handle missing optional fields', async () => {
      const result = await videoQueueService.addVideo({
        title: 'Test Video',
        filePath: '/test.mp4'
      });

      const video = await videoQueueService.getVideoById(result[0]);
      expect(video.description).toBeNull();
      expect(video.publish_at).toBeNull();
      expect(video.metadata).toBe('{}');
    });
  });

  describe('getScheduledVideos edge cases', () => {
    it('should handle multiple videos with same publish time', async () => {
      const publishTime = new Date(Date.now() - 1000).toISOString();
      
      await Promise.all([
        videoQueueService.addVideo({
          title: 'Video 1',
          filePath: '/test1.mp4',
          publishAt: publishTime,
          metadata: {}
        }),
        videoQueueService.addVideo({
          title: 'Video 2',
          filePath: '/test2.mp4',
          publishAt: publishTime,
          metadata: {}
        })
      ]);

      const videos = await videoQueueService.getScheduledVideos();
      expect(videos).toHaveLength(2);
      expect(videos[0].publish_at).toBe(videos[1].publish_at);
    });

    it('should handle videos with millisecond difference in publish time', async () => {
      const baseTime = Date.now();
      
      await videoQueueService.addVideo({
        title: 'Video 1',
        filePath: '/test1.mp4',
        publishAt: new Date(baseTime - 1).toISOString(),
        metadata: {}
      });

      await videoQueueService.addVideo({
        title: 'Video 2',
        filePath: '/test2.mp4',
        publishAt: new Date(baseTime).toISOString(),
        metadata: {}
      });

      const videos = await videoQueueService.getScheduledVideos();
      expect(videos).toHaveLength(2);
      expect(new Date(videos[0].publish_at) < new Date(videos[1].publish_at)).toBe(true);
    });
  });

  describe('updateVideo edge cases', () => {
    it('should handle partial updates', async () => {
      const [id] = await videoQueueService.addVideo({
        title: 'Original Title',
        description: 'Original Description',
        filePath: '/test.mp4',
        metadata: { original: true }
      });

      await videoQueueService.updateVideo(id, {
        title: 'Updated Title'
        // description and metadata omitted
      });

      const video = await videoQueueService.getVideoById(id);
      expect(video.title).toBe('Updated Title');
      expect(video.description).toBe('Original Description');
      expect(JSON.parse(video.metadata)).toEqual({ original: true });
    });

    it('should handle updating to empty values', async () => {
      const [id] = await videoQueueService.addVideo({
        title: 'Original Title',
        description: 'Original Description',
        filePath: '/test.mp4',
        metadata: { data: 'value' }
      });

      await videoQueueService.updateVideo(id, {
        title: 'Required Title', // title is required
        description: '',
        metadata: {}
      });

      const video = await videoQueueService.getVideoById(id);
      expect(video.description).toBe('');
      expect(video.metadata).toBe('{}');
    });
  });

  describe('deleteVideo edge cases', () => {
    it('should handle deleting already deleted video', async () => {
      const [id] = await videoQueueService.addVideo({
        title: 'To Delete',
        filePath: '/test.mp4',
        metadata: {}
      });

      await videoQueueService.deleteVideo(id);
      const result = await videoQueueService.deleteVideo(id);
      expect(result).toBe(0);
    });

    it('should handle deleting multiple videos simultaneously', async () => {
      const ids = await Promise.all([
        videoQueueService.addVideo({
          title: 'Video 1',
          filePath: '/test1.mp4',
          metadata: {}
        }),
        videoQueueService.addVideo({
          title: 'Video 2',
          filePath: '/test2.mp4',
          metadata: {}
        })
      ]);

      await Promise.all(ids.map(([id]) => videoQueueService.deleteVideo(id)));
      
      const remainingVideos = await videoQueueService.getAllVideos();
      expect(remainingVideos).toHaveLength(0);
    });
  });
});
