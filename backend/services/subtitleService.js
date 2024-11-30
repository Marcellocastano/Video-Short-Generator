import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

class SubtitleService {
    constructor() {
        this.outputDir = path.join(__dirname, '../temp/subtitles');
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    async generateSubtitlesFromText(text, duration, outputPath) {
        try {
            console.log('Generating ASS subtitles:');
            console.log('Text:', text);
            console.log('Duration:', duration);
            console.log('Output path:', outputPath);

            // Split text into chunks of reasonable length
            const words = text.split(' ');
            const chunks = [];
            let currentChunk = [];

            for (const word of words) {
                currentChunk.push(word);
                if (
                    currentChunk.join(' ').length > 30 ||
                    currentChunk.length > 5
                ) {
                    chunks.push(currentChunk.join(' '));
                    currentChunk = [];
                }
            }
            if (currentChunk.length > 0) {
                chunks.push(currentChunk.join(' '));
            }

            // Create ASS subtitle content
            let assContent = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,72,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,2,2,2,50,50,120,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;

            // Calculate timing for each chunk
            const chunkDuration = duration / chunks.length;
            let currentTime = 0;

            chunks.forEach((chunk, index) => {
                const startTime = this.formatTime(currentTime);
                currentTime += chunkDuration;
                const endTime = this.formatTime(currentTime);

                assContent += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${chunk}\n`;
            });

            console.log('Generated ASS content:', assContent);

            // Ensure directory exists
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Write ASS file
            await fs.promises.writeFile(
                outputPath.replace('.srt', '.ass'),
                assContent,
                'utf8'
            );

            return outputPath.replace('.srt', '.ass');
        } catch (error) {
            console.error('Error generating subtitles:', error);
            throw error;
        }
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }

    async burnSubtitles(videoPath, subtitlePath, outputPath, style = {}) {
        try {
            console.log('Burning subtitles:');
            console.log('Video path:', videoPath);
            console.log('Subtitle path:', subtitlePath);
            console.log('Output path:', outputPath);

            // Verify files exist
            if (!fs.existsSync(videoPath)) {
                throw new Error(`Video file not found: ${videoPath}`);
            }
            if (!fs.existsSync(subtitlePath)) {
                throw new Error(`Subtitle file not found: ${subtitlePath}`);
            }

            // Use simpler FFmpeg command with ASS subtitles
            const command = `ffmpeg -i "${videoPath}" -vf "ass='${subtitlePath.replace(/[\\]/g, '\\\\').replace(/[']/g, "'\\\\''")}'" -c:a copy -y "${outputPath}"`;
            console.log('Executing FFmpeg command:', command);

            const { stdout, stderr } = await execAsync(command);
            if (stderr) console.log('FFmpeg stderr:', stderr);

            // Verify output file was created
            if (!fs.existsSync(outputPath)) {
                throw new Error('Output file was not created');
            }

            const stats = await fs.promises.stat(outputPath);
            if (stats.size === 0) {
                throw new Error('Output file is empty');
            }

            return outputPath;
        } catch (error) {
            console.error('Error burning subtitles:', error);
            throw error;
        }
    }
}

export default new SubtitleService();
