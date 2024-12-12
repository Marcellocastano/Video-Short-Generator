import videoQueueService from '../services/videoQueueService.js';
import fs from 'fs/promises';
import * as fsSync from 'fs';
import path from 'path';
import { videosDir, getVideoUrl } from '../utils/paths.js';
import videoService from '../services/videoService.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';
import audioService from '../services/audioService.js';
import subtitleService from '../services/subtitleService.js';
import videoMashupService from '../services/videoMashupService.js';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class VideoController {
    async createVideo(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Nessun file video caricato',
                    errors: [
                        {
                            field: 'video',
                            message: 'Il file video è obbligatorio',
                        },
                    ],
                });
            }

            if (!req.body.title) {
                // Se c'è un errore, elimina il file caricato
                if (req.file) {
                    await fs.unlink(req.file.path).catch(console.error);
                }
                return res.status(400).json({
                    success: false,
                    message: 'Titolo mancante',
                    errors: [
                        {
                            field: 'title',
                            message: 'Il titolo è obbligatorio',
                        },
                    ],
                });
            }

            // Crea la directory permanente se non esiste
            await fs.mkdir(videosDir, { recursive: true });

            // Genera un nome file unico
            const fileExtension = path.extname(req.file.originalname);
            const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
            const permanentPath = path.join(videosDir, uniqueFilename);

            // Copia il file nella directory permanente
            await fs.copyFile(req.file.path, permanentPath);

            // Salva il percorso relativo nel database
            const relativeFilePath = getVideoUrl(uniqueFilename);

            const videoData = {
                title: req.body.title,
                description: req.body.description,
                filePath: relativeFilePath,
                publishAt: req.body.publishAt,
                metadata: {
                    hashtags: req.body.hashtags
                        ? JSON.parse(req.body.hashtags)
                        : [],
                    privacy: req.body.privacy || 'private',
                    language: req.body.language || 'it',
                    originalName: req.file.originalname,
                    mimeType: req.file.mimetype,
                    size: req.file.size,
                    filename: uniqueFilename,
                },
            };

            const result = await videoQueueService.addVideo(videoData);
            res.status(201).json({
                success: true,
                message: 'Video salvato con successo',
                videoId: result[0],
            });
        } catch (error) {
            // Se c'è un errore, elimina il file caricato
            if (req.file) {
                await fs.unlink(req.file.path).catch(console.error);
            }
            console.error('Errore nel salvataggio del video:', error);
            res.status(500).json({
                success: false,
                message: 'Errore nel salvataggio del video',
                error: error.message,
            });
        }
    }
    // CREATE - Salva un nuovo video
    async generateVideo(req, res) {
        let workingDir = null;
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
            workingDir = path.join(__dirname, '../temp', Date.now().toString());
            fsSync.mkdirSync(workingDir, { recursive: true });

            sendProgress(10, 'Generazione audio...');
            // Generate audio from text
            const audioPath = await audioService.generateSpeech(
                text,
                workingDir,
                voice,
                language
            );
            const audioDuration =
                await audioService.getAudioDuration(audioPath);

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
                    fsSync.writeFileSync(backgroundMusicPath, musicBuffer);
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
                    fsSync.copyFileSync(normalizedSpeechPath, finalAudioPath);
                }
            } else {
                // If no background music, just use the normalized speech
                fsSync.copyFileSync(normalizedSpeechPath, finalAudioPath);
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
            await fs.mkdir(videosDir, { recursive: true });

            // Copia il video nella directory permanente
            const filename = `${Date.now()}-final.mp4`;
            const permanentPath = path.join(videosDir, filename);
            await fs.copyFile(outputPath, permanentPath);

            // Invia solo il percorso relativo del file
            const videoUrl = getVideoUrl(filename);

            console.log('Video file generated successfully at:', permanentPath);
            console.log(
                'File size:',
                fsSync.statSync(permanentPath).size,
                'bytes'
            );
            console.log('Video URL:', videoUrl);

            sendProgress(100, 'Video completato!');
            res.write(JSON.stringify({ videoUrl }) + '\n');
            res.end();

            // Pulisci i file temporanei dopo un ritardo più lungo (5 minuti) per garantire il completamento del download
            setTimeout(
                async () => {
                    try {
                        await fs.rm(workingDir, { recursive: true });
                    } catch (err) {
                        console.error('Error cleaning up:', err);
                    }
                },
                5 * 60 * 1000
            ); // 5 minuti
        } catch (error) {
            console.error('Error generating video:', error);
            // Se non abbiamo ancora iniziato a scrivere la risposta, invia un errore
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to generate video' });
            } else {
                // Se abbiamo già iniziato a scrivere la risposta, scrivi l'errore come parte dello stream
                res.write(
                    JSON.stringify({ error: 'Failed to generate video' }) + '\n'
                );
                res.end();
            }

            // Pulisci la directory temporanea in caso di errore
            if (workingDir) {
                try {
                    await fs.rm(workingDir, { recursive: true });
                } catch (err) {
                    console.error('Error cleaning up after failure:', err);
                }
            }
        }
    }

    // READ - Ottieni tutti i video
    async getAllVideos(req, res) {
        try {
            const videos = await videoQueueService.getAllVideos();

            // Normalizza i percorsi dei file
            const processedVideos = videos.map(video => {
                let filePath = video.file_path;

                // Se il percorso non inizia con /uploads, aggiungi il prefisso
                if (!filePath.startsWith('/uploads')) {
                    filePath = getVideoUrl(path.basename(filePath));
                }

                return {
                    ...video,
                    file_path: filePath,
                };
            });

            res.json({
                success: true,
                videos: processedVideos,
            });
        } catch (error) {
            console.error('Errore nel recupero dei video:', error);
            res.status(500).json({
                success: false,
                message: 'Errore nel recupero dei video',
                error: error.message,
            });
        }
    }

    // READ - Ottieni un video specifico
    async getVideoById(req, res) {
        try {
            const { id } = req.params;
            const video = await videoQueueService.getVideoById(id);

            if (!video) {
                return res.status(404).json({
                    success: false,
                    message: 'Video non trovato',
                });
            }

            // Assicurati che il percorso del file sia relativo a /uploads
            const filePath = video.file_path.startsWith('/uploads')
                ? video.file_path
                : getVideoUrl(path.basename(video.file_path));

            res.json({
                success: true,
                video: {
                    ...video,
                    file_path: filePath,
                },
            });
        } catch (error) {
            console.error('Errore nel recupero del video:', error);
            res.status(500).json({
                success: false,
                message: 'Errore nel recupero del video',
                error: error.message,
            });
        }
    }

    // UPDATE - Aggiorna un video
    async updateVideo(req, res) {
        try {
            const videoId = req.params.id;
            const oldVideo = await videoQueueService.getVideoById(videoId);

            if (!oldVideo) {
                return res.status(404).json({
                    success: false,
                    message: 'Video non trovato',
                });
            }

            // Valida il formato dei metadata se forniti
            if (req.body.metadata !== undefined) {
                try {
                    if (typeof req.body.metadata === 'string') {
                        JSON.parse(req.body.metadata);
                    }
                } catch (error) {
                    return res.status(400).json({
                        success: false,
                        message: 'Formato metadata non valido',
                        errors: [
                            {
                                field: 'metadata',
                                message:
                                    'Il campo metadata deve essere un JSON valido',
                            },
                        ],
                    });
                }
            }

            const updateData = {
                title: req.body.title,
                description: req.body.description,
                publishAt: req.body.publishAt,
                metadata: req.body.metadata || oldVideo.metadata,
            };

            const result = await videoQueueService.updateVideo(
                videoId,
                updateData
            );
            if (result === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Video non trovato',
                });
            }
            res.json({
                success: true,
                message: 'Video aggiornato con successo',
            });
        } catch (error) {
            console.error("Errore nell'aggiornamento del video:", error);
            res.status(500).json({
                success: false,
                message: "Errore nell'aggiornamento del video",
                error: error.message,
            });
        }
    }

    // DELETE - Elimina un video
    async deleteVideo(req, res) {
        try {
            const video = await videoQueueService.getVideoById(req.params.id);
            if (!video) {
                return res.status(404).json({
                    success: false,
                    message: 'Video non trovato',
                });
            }

            // Elimina il file fisico
            if (video.file_path) {
                const filePath = path.join(
                    videosDir,
                    path.basename(video.file_path)
                );
                await fs
                    .unlink(filePath)
                    .catch(err =>
                        console.error("Errore nell'eliminazione del file:", err)
                    );
            }

            // Elimina il record dal database
            const result = await videoQueueService.deleteVideo(req.params.id);
            if (result === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Video non trovato',
                });
            }

            res.json({
                success: true,
                message: 'Video eliminato con successo',
            });
        } catch (error) {
            console.error("Errore nell'eliminazione del video:", error);
            res.status(500).json({
                success: false,
                message: "Errore nell'eliminazione del video",
                error: error.message,
            });
        }
    }

    // Stream video
    async streamVideo(req, res) {
        try {
            const video = await videoQueueService.getVideoById(req.params.id);
            if (!video) {
                return res.status(404).json({
                    success: false,
                    message: 'Video non trovato',
                });
            }

            const filePath = path.join(
                videosDir,
                path.basename(video.file_path)
            );
            const stat = await fs.stat(filePath);
            const fileSize = stat.size;
            const range = req.headers.range;

            if (range) {
                const parts = range.replace(/bytes=/, '').split('-');
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunksize = end - start + 1;
                const file = await fs.open(filePath, 'r');
                const stream = file.createReadStream({ start, end });

                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': 'video/mp4',
                });

                stream.pipe(res);
            } else {
                res.writeHead(200, {
                    'Content-Length': fileSize,
                    'Content-Type': 'video/mp4',
                });

                const fileStream = fs.createReadStream(filePath);
                fileStream.pipe(res);
            }
        } catch (error) {
            console.error('Errore nello streaming del video:', error);
            res.status(500).json({
                success: false,
                message: 'Errore nello streaming del video',
                error: error.message,
            });
        }
    }

    // Ricerca video da fonti multiple (Pixabay e Pexels)
    async searchVideos(req, res) {
        try {
            const { query } = req.query;
            if (!query) {
                return res
                    .status(400)
                    .json({ error: 'Query parameter is required' });
            }

            console.log('Searching videos for query:', query);
            const videos = await videoService.searchVideos(query);

            res.json(videos);
        } catch (error) {
            console.error('Error searching videos:', error);
            res.status(500).json({
                error: 'An error occurred while searching for videos',
                details: error.message,
            });
        }
    }
}

export default new VideoController();
