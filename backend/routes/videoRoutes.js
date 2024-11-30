import express from 'express';
import videoController from '../controllers/videoController.js';
import { validateVideo, validateVideoId } from '../middleware/validators.js';
import {
    videoUpload,
    handleUploadErrors,
    cleanupOnError,
} from '../middleware/fileUpload.js';

const router = express.Router();

// CREATE - Salva un nuovo video
router.post(
    '/videos',
    videoUpload,
    handleUploadErrors,
    validateVideo,
    cleanupOnError,
    videoController.createVideo
);

// READ - Ottieni tutti i video
router.get('/videos', videoController.getAllVideos);

// READ - Ottieni un video specifico
router.get('/videos/:id', validateVideoId, videoController.getVideoById);

// UPDATE - Aggiorna un video
router.put(
    '/videos/:id',
    validateVideoId,
    validateVideo,
    videoController.updateVideo
);

// DELETE - Elimina un video
router.delete('/videos/:id', validateVideoId, videoController.deleteVideo);

// Stream video
router.get('/videos/:id/stream', validateVideoId, videoController.streamVideo);

export default router;
