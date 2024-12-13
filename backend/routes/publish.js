import express from 'express';
import publishController from '../controllers/publishController.js';

const router = express.Router();

// Publish video to YouTube
router.post('/videos/:id/publish', publishController.publishVideo);

export default router;
