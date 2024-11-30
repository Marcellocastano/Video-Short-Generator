import fetch from 'node-fetch';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class VideoService {
    getPixabayApiKey() {
        const apiKey = process.env.PIXABAY_API_KEY;
        if (!apiKey) {
            throw new Error(
                'PIXABAY_API_KEY is required in environment variables'
            );
        }
        return apiKey;
    }

    async searchVideos(query) {
        try {
            if (!query) {
                throw new Error('Query parameter is required');
            }
            console.log('apikeyyyyyyyy:', this.getPixabayApiKey());
            const url = `https://pixabay.com/api/videos/?key=${this.getPixabayApiKey()}&q=${encodeURIComponent(query)}&per_page=10`;
            console.log(
                'Searching videos with URL:',
                url.replace(this.getPixabayApiKey(), '***')
            );

            const response = await fetch(url);

            if (!response.ok) {
                const text = await response.text();
                console.error('Pixabay API error:', text);
                throw new Error(
                    `Pixabay API error: ${response.status} ${response.statusText}`
                );
            }

            const data = await response.json();
            console.log('Pixabay API response:', JSON.stringify(data, null, 2));

            if (!data.hits || !Array.isArray(data.hits)) {
                throw new Error('Invalid response format from Pixabay API');
            }

            // Trasforma i risultati nel formato atteso dal frontend
            return data.hits.map(video => ({
                id: video.id,
                duration: video.duration,
                width: video.width,
                height: video.height,
                videos: {
                    tiny: {
                        url: video.videos.tiny.url,
                        width: video.videos.tiny.width,
                        height: video.videos.tiny.height,
                        size: video.videos.tiny.size,
                    },
                    small: {
                        url: video.videos.small.url,
                        width: video.videos.small.width,
                        height: video.videos.small.height,
                        size: video.videos.small.size,
                    },
                    medium: {
                        url: video.videos.medium.url,
                        width: video.videos.medium.width,
                        height: video.videos.medium.height,
                        size: video.videos.medium.size,
                    },
                    large: {
                        url: video.videos.large.url,
                        width: video.videos.large.width,
                        height: video.videos.large.height,
                        size: video.videos.large.size,
                    },
                },
            }));
        } catch (error) {
            console.error('Error in searchVideos:', error);
            throw error;
        }
    }

    async downloadVideo(url, outputPath) {
        try {
            console.log('Downloading video from:', url);
            console.log('Saving to:', outputPath);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(
                    `Failed to download video: ${response.status} ${response.statusText}`
                );
            }

            const buffer = await response.buffer();
            await fs.promises.writeFile(outputPath, buffer);

            console.log('Video downloaded successfully');
            return outputPath;
        } catch (error) {
            console.error('Error downloading video:', error);
            throw error;
        }
    }
}

export default new VideoService();
