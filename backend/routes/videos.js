import express from 'express';
import videoController from '../controllers/videoController.js';
import { validateVideo, validateVideoId } from '../middleware/validators.js';
import {
    videoUpload,
    handleUploadErrors,
    cleanupOnError,
} from '../middleware/fileUpload.js';

const router = express.Router();

// READ - Ottieni tutti i video
router.get('/', videoController.getAllVideos);

// Search videos from multiple sources
router.get('/search', videoController.searchVideos);
router.post('/generate', videoController.generateVideo);

// CREATE - Salva un nuovo video
router.post(
    '/',
    videoUpload,
    handleUploadErrors,
    validateVideo,
    cleanupOnError,
    videoController.createVideo
);

// Save generated video
router.post(
    '/save',
    videoUpload,
    handleUploadErrors,
    validateVideo,
    cleanupOnError,
    videoController.createVideo
);

// READ - Ottieni un video specifico
router.get('/:id', validateVideoId, videoController.getVideoById);

// UPDATE - Aggiorna un video
router.put('/:id', validateVideoId, validateVideo, videoController.updateVideo);

// DELETE - Elimina un video
router.delete('/:id', validateVideoId, videoController.deleteVideo);

// Stream video
router.get('/:id/stream', validateVideoId, videoController.streamVideo);

export default router;
