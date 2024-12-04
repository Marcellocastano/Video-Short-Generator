import videoQueueService from '../services/videoQueueService.js';
import fs from 'fs/promises';
import path from 'path';
import { videosDir, getVideoUrl } from '../utils/paths.js';

class VideoController {
    // CREATE - Salva un nuovo video
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
}

export default new VideoController();
