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

    getPexelsApiKey() {
        const apiKey = process.env.PEXELS_API_KEY;
        if (!apiKey) {
            throw new Error(
                'PEXELS_API_KEY is required in environment variables'
            );
        }
        return apiKey;
    }

    async searchPixabayVideos(query) {
        try {
            const url = `https://pixabay.com/api/videos/?key=${this.getPixabayApiKey()}&q=${encodeURIComponent(query)}&per_page=10`;
            console.log(
                'Searching Pixabay videos with URL:',
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

            // Transform Pixabay results to common format
            return data.hits.map(video => ({
                id: `pixabay_${video.id}`,
                source: 'pixabay',
                duration: video.duration,
                width: video.width,
                height: video.height,
                preview: video.videos.tiny.url,
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
            console.error('Error in searchPixabayVideos:', error);
            return []; // Return empty array on error to allow fallback to other sources
        }
    }

    async searchPexelsVideos(query) {
        try {
            const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=10`;
            console.log('Searching Pexels videos with URL:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `${this.getPexelsApiKey()}`, // Aggiunto il token direttamente
                },
            });

            if (!response.ok) {
                const text = await response.text();
                console.error('Pexels API error:', text);
                throw new Error(
                    `Pexels API error: ${response.status} ${response.statusText}`
                );
            }

            const data = await response.json();
            console.log('Pexels API response:', JSON.stringify(data, null, 2));

            if (!data.videos || !Array.isArray(data.videos)) {
                throw new Error('Invalid response format from Pexels API');
            }

            // Transform Pexels results to common format
            return data.videos
                .map(video => {
                    // Mappa i file video per qualità
                    const files = {};

                    video.video_files.forEach(file => {
                        let quality;
                        switch (file.quality) {
                            case 'sd':
                                quality = 'small';
                                break;
                            case 'hd':
                                quality = 'medium';
                                break;
                            case 'full_hd':
                            case '2k':
                            case '4k':
                                quality = 'large';
                                break;
                            default:
                                return; // Salta questo file se la qualità non è mappabile
                        }

                        files[quality] = {
                            url: file.link,
                            width: file.width,
                            height: file.height,
                            size: file.file_size || 0,
                        };
                    });

                    // Aggiungi la versione tiny usando la prima immagine di anteprima
                    const previewImage =
                        video.video_pictures?.[0]?.picture || video.image;
                    files.tiny = {
                        url: previewImage,
                        width: Math.floor(video.width / 4),
                        height: Math.floor(video.height / 4),
                        size: 0,
                    };

                    return {
                        id: `pexels_${video.id}`,
                        source: 'pexels',
                        duration: video.duration,
                        width: video.width,
                        height: video.height,
                        preview: previewImage,
                        videos: files,
                    };
                })
                .filter(video => {
                    // Filtra solo i video che hanno almeno una versione utilizzabile
                    return Object.keys(video.videos).length > 1; // Deve avere almeno tiny e un'altra qualità
                });
        } catch (error) {
            console.error('Error in searchPexelsVideos:', error);
            return []; // Return empty array on error to allow fallback to other sources
        }
    }

    async searchVideos(query) {
        try {
            if (!query) {
                throw new Error('Query parameter is required');
            }

            // Search videos from both APIs in parallel
            const [pixabayVideos, pexelsVideos] = await Promise.all([
                this.searchPixabayVideos(query),
                this.searchPexelsVideos(query),
            ]);

            // Combine and shuffle results
            const allVideos = [...pixabayVideos, ...pexelsVideos];
            for (let i = allVideos.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allVideos[i], allVideos[j]] = [allVideos[j], allVideos[i]];
            }

            return allVideos;
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
