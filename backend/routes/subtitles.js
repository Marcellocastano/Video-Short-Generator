import express from 'express';
import subtitleController from '../controllers/subtitleController.js';

const router = express.Router();

// Generate subtitles from text
router.post('/generate', subtitleController.generateSubtitles);

// Burn subtitles into video
router.post('/burn', subtitleController.burnSubtitles);

export default router;
