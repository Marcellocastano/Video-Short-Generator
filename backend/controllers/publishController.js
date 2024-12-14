import { db } from '../database/db.js';
import YouTubeService from '../services/youtube.js';

class PublishController {
    async publishVideo(req, res) {
        try {
            const { id } = req.params;
            const { publishMode, privacy } = req.body;

            // Recupera le informazioni del video dal database
            const video = await db('videos').where({ id }).first();

            if (!video) {
                return res.status(404).json({ error: 'Video not found' });
            }

            // Verifica che l'utente sia autenticato su YouTube
            if (!YouTubeService.isAuthenticated()) {
                return res.status(401).json({
                    error: 'YouTube authentication required',
                    authUrl: YouTubeService.getAuthUrl(),
                });
            }

            // Prepara i dati per l'upload
            const uploadData = {
                title: video.title || 'Video senza titolo',
                description: video.description || '',
                privacy: privacy,
                scheduledTime:
                    publishMode === 'schedule' ? req.body.scheduledTime : null,
            };

            // Carica il video su YouTube
            const youtubeResult = await YouTubeService.uploadVideo(
                video.file_path,
                uploadData
            );

            // Aggiorna il database con le informazioni di YouTube
            await db('videos')
                .where({ id })
                .update({
                    youtube_id: youtubeResult.videoId,
                    youtube_privacy: privacy,
                    publish_status:
                        publishMode === 'now' ? 'published' : 'scheduled',
                    publish_at:
                        publishMode === 'schedule'
                            ? req.body.scheduledTime
                            : null,
                });

            res.json({
                success: true,
                youtubeUrl: youtubeResult.url,
            });
        } catch (error) {
            console.error('Error publishing video:', error);
            res.status(500).json({ error: 'Failed to publish video' });
        }
    }
}

export default new PublishController();
