import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Percorso base dell'applicazione (root del progetto)
export const rootDir = path.join(__dirname, '../..');

// Percorso della directory uploads
export const uploadsDir = path.join(rootDir, 'uploads');

// Percorso della directory videos
export const videosDir = path.join(uploadsDir, 'videos');

// Percorso della directory temporanea
export const tempDir = path.join(rootDir, 'temp');

// Funzione per ottenere il percorso relativo di un file rispetto alla directory uploads
export const getRelativePath = absolutePath => {
    return path.relative(uploadsDir, absolutePath);
};

// Funzione per ottenere l'URL relativo di un file video
export const getVideoUrl = filename => {
    return `/uploads/videos/${filename}`;
};
