import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Search music from Jamendo
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res
                .status(400)
                .json({ error: 'Query parameter is required' });
        }

        const clientId = process.env.JAMENDO_CLIENT_ID;
        if (!clientId) {
            return res
                .status(500)
                .json({ error: 'Jamendo client ID not configured' });
        }

        // Jamendo API endpoint for track search
        const apiUrl =
            `https://api.jamendo.com/v3.0/tracks/?` +
            new URLSearchParams({
                client_id: clientId,
                format: 'json',
                limit: '12',
                namesearch: query,
                include: 'musicinfo',
                audioformat: 'mp32',
                speed: 'medium',
                boost: 'popularity_month',
                groupby: 'artist_id',
            });

        console.log(
            'Searching music with URL:',
            apiUrl.replace(clientId, '***')
        );

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok || data.headers?.status === 'failed') {
            console.error('API response error:', data.headers);
            return res.status(500).json({
                error: 'API request failed',
                details: data.headers?.error_message,
            });
        }

        // Map the results to include all necessary fields
        const mappedResults = data.results.map(track => ({
            id: track.id,
            title: track.name,
            artist: track.artist_name,
            duration: track.duration,
            preview_url: track.audio, // URL per l'anteprima
            audiodownload: track.audiodownload, // URL per il download completo
            audio: track.audio, // URL alternativo
        }));

        console.log('Found tracks:', mappedResults.length);
        res.json(mappedResults);
    } catch (error) {
        console.error('Error searching music:', error);
        res.status(500).json({ error: 'Failed to search music' });
    }
});

export default router;
