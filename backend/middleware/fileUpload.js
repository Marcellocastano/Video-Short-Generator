import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione dello storage per i video
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Usa la directory di test se siamo in ambiente di test
        const uploadDir =
            process.env.NODE_ENV === 'test'
                ? global.TEST_CONFIG.UPLOAD_DIR
                : path.join(__dirname, '../uploads/videos');

        // Crea la directory se non esiste
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Salva la directory nel request per uso futuro
        req.uploadDir = uploadDir;

        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Genera un nome file unico con timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const filename = uniqueSuffix + path.extname(file.originalname);

        // Salva il nome del file nel request per uso futuro
        req.uploadedFilename = filename;

        cb(null, filename);
    },
});

// Filtro per i file video
const fileFilter = (req, file, cb) => {
    // Tipi MIME consentiti per i video
    const allowedMimes = [
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-ms-wmv',
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                'Tipo di file non supportato. Carica solo file video (MP4, MOV, AVI, WMV)'
            ),
            false
        );
    }
};

// Configurazione di multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 500, // Limite di 500MB
        files: 1, // Un solo file alla volta
    },
});

// Middleware per la gestione degli errori di upload
export const handleUploadErrors = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message:
                    'Il file supera la dimensione massima consentita (500MB)',
            });
        }
        return res.status(400).json({
            success: false,
            message: "Errore durante l'upload del file",
            error: err.message,
        });
    }

    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }

    next();
};

// Middleware per eliminare il file in caso di errore nella validazione
export const cleanupOnError = (req, res, next) => {
    res.on('finish', () => {
        if (req.file && res.statusCode !== 201) {
            fs.unlink(req.file.path, err => {
                if (err)
                    console.error('Errore durante la pulizia del file:', err);
            });
        }
    });
    next();
};

export const videoUpload = upload.single('video');
