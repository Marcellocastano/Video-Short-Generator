import db from '../database/index.js';

class VideoQueueService {
  async addVideo(videoData) {
    return await db('videos').insert({
      title: videoData.title,
      description: videoData.description,
      file_path: videoData.filePath,
      publish_at: videoData.publishAt,
      metadata: JSON.stringify(videoData.metadata || {})
    });
  }

  async getVideoById(id) {
    return await db('videos')
      .where({ id })
      .first();
  }

  async getScheduledVideos() {
    const now = new Date().toISOString();
    return await db('videos')
      .where('status', 'pending')
      .whereNotNull('publish_at')
      .where('publish_at', '<=', now)
      .orderBy('publish_at', 'asc');
  }

  async updateVideoStatus(id, status, youtubeId = null) {
    const updateData = { status };
    if (youtubeId) {
      updateData.youtube_id = youtubeId;
    }
    return await db('videos')
      .where({ id })
      .update(updateData);
  }

  async updateVideo(id, videoData) {
    const updateData = {};
    if (videoData.title !== undefined) updateData.title = videoData.title;
    if (videoData.description !== undefined) updateData.description = videoData.description;
    if (videoData.publishAt !== undefined) updateData.publish_at = videoData.publishAt;
    if (videoData.metadata !== undefined) updateData.metadata = JSON.stringify(videoData.metadata);
    
    return await db('videos')
      .where({ id })
      .update(updateData);
  }

  async deleteVideo(id) {
    return await db('videos')
      .where({ id })
      .del();
  }

  async getAllVideos() {
    return await db('videos')
      .orderBy('publish_at', 'desc');
  }
}

export default new VideoQueueService();
