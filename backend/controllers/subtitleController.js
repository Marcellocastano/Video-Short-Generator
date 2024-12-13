import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';
import subtitleService from '../services/subtitleService.js';

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, '../temp/subtitles');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

class SubtitleController {
    async generateSubtitles(req, res) {
        try {
            const { text, duration } = req.body;
            const outputPath = path.join(tempDir, `${Date.now()}.srt`);
            const subtitlePath =
                await subtitleService.generateSubtitlesFromText(
                    text,
                    duration,
                    outputPath
                );
            res.json({ subtitlePath });
        } catch (error) {
            console.error('Error generating subtitles:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async burnSubtitles(req, res) {
        try {
            const { videoPath, subtitlePath, style } = req.body;
            const outputPath = path.join(
                tempDir,
                `${Date.now()}_with_subs.mp4`
            );
            const finalVideoPath = await subtitleService.burnSubtitles(
                videoPath,
                subtitlePath,
                outputPath,
                style
            );
            res.json({ videoPath: finalVideoPath });
        } catch (error) {
            console.error('Error burning subtitles:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

export default new SubtitleController();
