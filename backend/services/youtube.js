import { google } from 'googleapis';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { videosDir } from '../utils/paths.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const youtube = google.youtube('v3');
const OAuth2 = google.auth.OAuth2;

class YouTubeService {
    constructor() {
        this.oauth2Client = new OAuth2(
            process.env.YOUTUBE_CLIENT_ID,
            process.env.YOUTUBE_CLIENT_SECRET,
            process.env.YOUTUBE_REDIRECT_URI
        );

        // Se abbiamo un refresh token, lo impostiamo
        if (process.env.YOUTUBE_REFRESH_TOKEN) {
            this.oauth2Client.setCredentials({
                refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
            });
        }
    }

    async uploadVideo(
        videoPath,
        { title, description, privacy, scheduledTime = null }
    ) {
        try {
            // Converte il percorso relativo in assoluto se necessario
            const absolutePath = videoPath.startsWith('/')
                ? path.join(
                      process.cwd(),
                      videoPath.replace('/uploads/videos/', '/uploads/videos/')
                  )
                : videoPath;

            // Verifica che il file esista
            if (!fs.existsSync(absolutePath)) {
                throw new Error(
                    `Video file not found at path: ${absolutePath}`
                );
            }

            const fileSize = fs.statSync(absolutePath).size;

            const requestBody = {
                snippet: {
                    title,
                    description,
                },
                status: {
                    privacyStatus: privacy,
                },
            };

            // Se c'è una data programmata, la aggiungiamo
            if (scheduledTime) {
                requestBody.status.publishAt = new Date(
                    scheduledTime
                ).toISOString();
            }

            const media = {
                body: fs.createReadStream(absolutePath),
            };

            const response = await youtube.videos.insert({
                auth: this.oauth2Client,
                part: 'snippet,status',
                requestBody,
                media: media,
            });

            return {
                success: true,
                videoId: response.data.id,
                url: `https://youtube.com/watch?v=${response.data.id}`,
            };
        } catch (error) {
            console.error('Error uploading to YouTube:', error);
            throw error;
        }
    }

    // Genera l'URL di autorizzazione per ottenere il refresh token
    getAuthUrl() {
        const scopes = [
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/youtube',
        ];

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            include_granted_scopes: true,
        });
    }

    // Gestisce il callback di autorizzazione e ottiene il refresh token
    async handleAuthCallback(code) {
        const { tokens } = await this.oauth2Client.getToken(code);
        this.oauth2Client.setCredentials(tokens);
        return tokens;
    }

    // Verifica se siamo autenticati
    isAuthenticated() {
        return !!this.oauth2Client.credentials.refresh_token;
    }
}

export default new YouTubeService();
