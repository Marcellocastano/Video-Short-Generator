import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';
import audioService from '../services/audioService.js';

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, '../temp/audio');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

class TTSController {
    async generateTTS(req, res) {
        try {
            const { text, language = 'it-IT', voice = 'female' } = req.body;
            const audioPath = await audioService.generateTTS(
                text,
                language,
                voice
            );
            res.json({ audioPath });
        } catch (error) {
            console.error('Error generating TTS:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async getBackgroundMusic(req, res) {
        try {
            // TODO: Implement background music selection logic
            res.json({ message: 'Background music endpoint' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

export default new TTSController();
