import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import videoRoutes from './routes/videoRoutes.js';
import videosRouter from './routes/videos.js';
import musicRouter from './routes/music.js';
import { uploadsDir, videosDir } from './utils/paths.js';
import publishRoutes from './routes/publish.js';
import authRoutes from './routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

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

app.use('/api', publishRoutes);
app.use('/api', authRoutes);

// Rimuovi CSP per i file statici
app.use((req, res, next) => {
    res.removeHeader('Content-Security-Policy');
    next();
});

// Verifica e crea le directory necessarie
try {
    await fs.access(uploadsDir);
} catch (error) {
    await fs.mkdir(uploadsDir, { recursive: true });
}

try {
    await fs.access(videosDir);
} catch (error) {
    await fs.mkdir(videosDir, { recursive: true });
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
    express.static(uploadsDir, {
        setHeaders: (res, path, stat) => {
            res.removeHeader('Content-Security-Policy');
            res.set({
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Range',
                'Accept-Ranges': 'bytes',
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
