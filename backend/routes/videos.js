import express from 'express';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import audioService from '../services/audioService.js';
import subtitleService from '../services/subtitleService.js';
import videoMashupService from '../services/videoMashupService.js';
import videoController from '../controllers/videoController.js';
import { validateVideo } from '../middleware/validators.js';
import { videosDir, getVideoUrl } from '../utils/paths.js';
import videoService from '../services/videoService.js';
import {
    videoUpload,
    handleUploadErrors,
    cleanupOnError,
} from '../middleware/fileUpload.js';

const execAsync = promisify(exec);
const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Rotta per salvare un video generato
router.post(
    '/save',
    videoUpload,
    handleUploadErrors,
    validateVideo,
    cleanupOnError,
    videoController.createVideo
);

// Rotta per ottenere tutti i video
router.get('/', videoController.getAllVideos);

// Search videos from multiple sources (Pixabay and Pexels)
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res
                .status(400)
                .json({ error: 'Query parameter is required' });
        }

        console.log('Searching videos for query:', query);
        const videos = await videoService.searchVideos(query);
        console.log(`Found ${videos.length} videos in total`);

        res.json(videos);
    } catch (error) {
        console.error('Error searching videos:', error);
        res.status(500).json({
            error: 'Failed to search videos',
            details: error.message,
        });
    }
});

// Rotta per ottenere un video specifico
router.get('/:id', videoController.getVideoById);

// Rotta per eliminare un video
router.delete('/:id', videoController.deleteVideo);

// Process and combine video components
router.post('/generate', async (req, res) => {
    try {
        const { text, videos, voice, language, backgroundMusic } = req.body;

        if (!text || !videos || !videos.length) {
            return res
                .status(400)
                .json({ error: 'Missing required parameters' });
        }

        // Set headers for streaming response
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Transfer-Encoding', 'chunked');

        const sendProgress = (progress, step) => {
            res.write(JSON.stringify({ progress, step }) + '\n');
        };

        // Create working directory
        const workingDir = path.join(
            __dirname,
            '../temp',
            Date.now().toString()
        );
        fs.mkdirSync(workingDir, { recursive: true });

        sendProgress(10, 'Generazione audio...');
        // Generate audio from text
        const audioPath = await audioService.generateSpeech(
            text,
            workingDir,
            voice,
            language
        );
        const audioDuration = await audioService.getAudioDuration(audioPath);

        sendProgress(20, 'Download musica di sottofondo...');
        let backgroundMusicPath = null;
        if (backgroundMusic) {
            try {
                console.log(
                    'Downloading background music from:',
                    backgroundMusic
                );
                backgroundMusicPath = path.join(
                    workingDir,
                    'background_music.mp3'
                );
                const musicResponse = await fetch(backgroundMusic);

                if (!musicResponse.ok) {
                    throw new Error(
                        `Failed to download music: ${musicResponse.statusText}`
                    );
                }

                const musicBuffer = await musicResponse.buffer();
                fs.writeFileSync(backgroundMusicPath, musicBuffer);
                console.log('Background music downloaded successfully');
            } catch (error) {
                console.error('Error downloading background music:', error);
                backgroundMusicPath = null; // Reset if download fails
            }
        }

        sendProgress(30, 'Normalizzazione audio...');
        // Normalize speech audio
        const normalizedSpeechPath = path.join(
            workingDir,
            'normalized_speech.wav'
        );
        await execAsync(
            `${process.env.FFMPEG_PATH} -i "${audioPath}" -af "volume=2.0" -ar 44100 -ac 2 "${normalizedSpeechPath}"`
        );

        // If we have background music, mix it with the speech
        const finalAudioPath = path.join(workingDir, 'final_audio.wav');
        if (backgroundMusicPath) {
            try {
                sendProgress(40, 'Mixaggio audio...');
                console.log('Normalizing and mixing background music...');

                // First normalize and loop the background music to match speech duration
                const normalizedMusicPath = path.join(
                    workingDir,
                    'normalized_music.wav'
                );
                await execAsync(
                    `${process.env.FFMPEG_PATH} -i "${backgroundMusicPath}" -af "volume=0.5" -ar 44100 -ac 2 "${normalizedMusicPath}"`
                );

                // Mix speech with background music
                const mixCommand = `${process.env.FFMPEG_PATH} -i "${normalizedSpeechPath}" -i "${normalizedMusicPath}" -filter_complex "[1:a]aloop=loop=-1:size=2e+09[loop];[loop]apad=whole_dur=${audioDuration}[music];[0:a][music]amix=inputs=2:duration=first:weights=1 0.5[a]" -map "[a]" "${finalAudioPath}"`;
                console.log('Executing mix command:', mixCommand);
                await execAsync(mixCommand);

                console.log('Audio mixing completed successfully');
            } catch (error) {
                console.error('Error mixing audio:', error);
                // If mixing fails, use only the speech audio
                fs.copyFileSync(normalizedSpeechPath, finalAudioPath);
            }
        } else {
            // If no background music, just use the normalized speech
            fs.copyFileSync(normalizedSpeechPath, finalAudioPath);
        }

        sendProgress(50, 'Generazione sottotitoli...');
        // Generate subtitles
        const subtitlePath = path.join(workingDir, 'subtitles.ass');
        await subtitleService.generateSubtitlesFromText(
            text,
            audioDuration,
            subtitlePath
        );

        sendProgress(70, 'Creazione video mashup...');
        // Create video mashup
        const combinedVideoPath = await videoMashupService.createMashup(
            videos,
            workingDir,
            audioDuration
        );

        sendProgress(90, 'Finalizzazione video...');
        // Combine video with audio and burn subtitles
        const outputPath = path.join(workingDir, 'final.mp4');
        await execAsync(
            `${process.env.FFMPEG_PATH} -i "${combinedVideoPath}" -i "${finalAudioPath}" -map 0:v -map 1:a -vf "subtitles=${subtitlePath}" -c:v libx264 -c:a aac -b:a 192k -shortest "${outputPath}"`
        );

        // Crea la directory permanente se non esiste
        await fs.promises.mkdir(videosDir, { recursive: true });

        // Copia il video nella directory permanente
        const filename = `${Date.now()}-final.mp4`;
        const permanentPath = path.join(videosDir, filename);
        await fs.promises.copyFile(outputPath, permanentPath);

        // Invia solo il percorso relativo del file
        const videoUrl = getVideoUrl(filename);

        console.log('Video file generated successfully at:', permanentPath);
        console.log('File size:', fs.statSync(permanentPath).size, 'bytes');
        console.log('Video URL:', videoUrl);

        sendProgress(100, 'Video completato!');
        res.write(JSON.stringify({ videoUrl }) + '\n');
        res.end();

        // Pulisci i file temporanei dopo un ritardo più lungo (5 minuti) per garantire il completamento del download
        setTimeout(
            () => {
                fs.rm(workingDir, { recursive: true }, err => {
                    if (err) console.error('Error cleaning up:', err);
                });
            },
            5 * 60 * 1000
        ); // 5 minuti
    } catch (error) {
        console.error('Error generating video:', error);
        res.status(500).json({ error: 'Failed to generate video' });
    }
});

export default router;
