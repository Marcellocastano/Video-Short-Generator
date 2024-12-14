import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

// Inizia il processo di autenticazione
router.get('/auth/youtube', authController.initiateYouTubeAuth);

// Gestisce il callback di autenticazione
router.get('/auth/youtube/callback', authController.handleYouTubeCallback);

// Verifica lo stato dell'autenticazione
router.get('/auth/youtube/status', authController.checkYouTubeAuthStatus);

export default router;
