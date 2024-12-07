import express from 'express';
import YouTubeService from '../services/youtube.js';

const router = express.Router();

// Inizia il processo di autenticazione
router.get('/auth/youtube', (req, res) => {
    const authUrl = YouTubeService.getAuthUrl();
    res.redirect(authUrl);
});

// Gestisce il callback di autenticazione
router.get('/auth/youtube/callback', async (req, res) => {
    try {
        const { code } = req.query;
        const tokens = await YouTubeService.handleAuthCallback(code);

        // Qui dovresti salvare il refresh_token in modo sicuro
        // Per ora lo mostriamo solo (in produzione non farlo mai!)
        res.json({
            message: 'Authentication successful',
            refresh_token: tokens.refresh_token,
        });
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

// Verifica lo stato dell'autenticazione
router.get('/auth/youtube/status', (req, res) => {
    const isAuthenticated = YouTubeService.isAuthenticated();
    res.json({ authenticated: isAuthenticated });
});

export default router;
