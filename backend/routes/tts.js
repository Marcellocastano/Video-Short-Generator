import express from 'express';
import ttsController from '../controllers/ttsController.js';

const router = express.Router();

// Generate TTS audio from text
router.post('/tts', ttsController.generateTTS);

// Get background music
router.get('/music', ttsController.getBackgroundMusic);

export default router;
