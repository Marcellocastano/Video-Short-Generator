import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import videoRoutes from './routes/videoRoutes.js';
import videosRouter from './routes/videos.js';
import musicRouter from './routes/music.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(path.dirname(__dirname), '.env') });

const app = express();

// Basic middleware
app.use(
    cors({
        origin: ['http://localhost:5173'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
        exposedHeaders: ['Content-Range', 'Content-Length', 'Accept-Ranges'],
        credentials: true,
    })
);

app.use(express.json());

// Rimuovi CSP per i file statici
app.use((req, res, next) => {
    res.removeHeader('Content-Security-Policy');
    next();
});

// Configurazione directory uploads
const uploadsPath = path.join(__dirname, '../uploads');

// Verifica directory uploads
try {
    await fs.access(uploadsPath);
} catch (error) {
    await fs.mkdir(uploadsPath, { recursive: true });
}

// Middleware per file statici
app.use('/uploads', (req, res, next) => {
    const normalizedPath = req.path.replace(/\/+/g, '/');
    req.url = normalizedPath;
    res.removeHeader('Content-Security-Policy');
    next();
});

app.use(
    '/uploads',
    express.static(uploadsPath, {
        setHeaders: (res, path, stat) => {
            res.removeHeader('Content-Security-Policy');
            res.set({
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Range',
                'Accept-Ranges': 'bytes',
                'Content-Type': 'video/mp4',
            });
        },
    })
);

// API routes
app.use('/api/videos', videosRouter);
app.use('/api', videoRoutes);
app.use('/api/music', musicRouter);

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: err.message,
    });
});

export default app;
