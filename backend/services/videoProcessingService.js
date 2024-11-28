import ffmpeg from "fluent-ffmpeg";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

class VideoProcessingService {
    constructor() {
        this.outputDir = path.join(__dirname, "../temp/processed");
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        // Set FFmpeg path from environment variable if provided
        if (process.env.FFMPEG_PATH) {
            ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
        }
    }

    async resizeVideo(inputPath, outputPath, width = 1080, height = 1920) {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .size(`${width}x${height}`)
                .autopad(true, "black")
                .output(outputPath)
                .on("end", () => resolve(outputPath))
                .on("error", (err) => {
                    console.error("Error resizing video:", err);
                    reject(err);
                })
                .run();
        });
    }

    async combineVideoAudio(videoPath, audioPath, outputPath) {
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .input(audioPath)
                .outputOptions(["-map 0:v", "-map 1:a", "-shortest"])
                .output(outputPath)
                .on("end", () => resolve(outputPath))
                .on("error", (err) => {
                    console.error("Error combining video and audio:", err);
                    reject(err);
                })
                .run();
        });
    }

    async addWatermark(videoPath, watermarkText, outputPath) {
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .videoFilters({
                    filter: "drawtext",
                    options: {
                        text: watermarkText,
                        fontsize: 24,
                        fontcolor: "white",
                        x: "(w-text_w)/2",
                        y: "h-th-10",
                    },
                })
                .output(outputPath)
                .on("end", () => resolve(outputPath))
                .on("error", (err) => {
                    console.error("Error adding watermark:", err);
                    reject(err);
                })
                .run();
        });
    }

    async trimVideo(inputPath, outputPath, startTime, duration) {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .setStartTime(startTime)
                .setDuration(duration)
                .output(outputPath)
                .on("end", () => resolve(outputPath))
                .on("error", (err) => {
                    console.error("Error trimming video:", err);
                    reject(err);
                })
                .run();
        });
    }

    async getVideoInfo(videoPath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(videoPath, (err, metadata) => {
                if (err) reject(err);
                else resolve(metadata);
            });
        });
    }

    async addSubtitlesToVideo(videoPath, subtitlesPath, outputPath) {
        try {
            console.log("Adding subtitles to video...");
            console.log("Video path:", videoPath);
            console.log("Subtitles path:", subtitlesPath);
            console.log("Output path:", outputPath);

            // Using simpler subtitle styling with fixed positioning
            const subtitleStyle =
                "FontName=Arial,FontSize=24,PrimaryColour=white,BackColour=&H80000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=30,Alignment=2";
            const command = `ffmpeg -i "${videoPath}" -vf "subtitles='${subtitlesPath}':force_style='${subtitleStyle}'" -c:a copy "${outputPath}"`;
            console.log("Executing command:", command);

            await execAsync(command);
            return outputPath;
        } catch (error) {
            console.error("Error adding subtitles to video:", error);
            throw error;
        }
    }

    async addAudioToVideo(videoPath, audioPath, outputPath) {
        try {
            console.log("Adding audio to video...");
            console.log("Video path:", videoPath);
            console.log("Audio path:", audioPath);
            console.log("Output path:", outputPath);

            const command = `ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -shortest "${outputPath}"`;
            console.log("Executing command:", command);

            await execAsync(command);
            return outputPath;
        } catch (error) {
            console.error("Error adding audio to video:", error);
            throw error;
        }
    }

    async cropVideoToVertical(inputPath, outputPath) {
        try {
            console.log("Cropping video to vertical format...");
            console.log("Input path:", inputPath);
            console.log("Output path:", outputPath);

            // Calcola il crop per mantenere il centro del video e ridimensiona per YouTube Shorts (1080x1920)
            const command = `ffmpeg -i "${inputPath}" -vf "crop=ih*9/16:ih,scale=1080:1920" -c:a copy "${outputPath}"`;
            console.log("Executing command:", command);

            await execAsync(command);
            return outputPath;
        } catch (error) {
            console.error("Error cropping video:", error);
            throw error;
        }
    }

    async resizeVideoForYouTubeShorts(inputPath, outputPath) {
        try {
            console.log("Resizing video for YouTube Shorts...");
            console.log("Input path:", inputPath);
            console.log("Output path:", outputPath);

            const command = `ffmpeg -i "${inputPath}" -vf "scale=1080:1920" -c:a copy "${outputPath}"`;
            console.log("Executing command:", command);

            await execAsync(command);
            return outputPath;
        } catch (error) {
            console.error("Error resizing video:", error);
            throw error;
        }
    }

    async getVideoInfo(videoPath) {
        try {
            if (!fs.existsSync(videoPath)) {
                throw new Error(`Video file not found: ${videoPath}`);
            }

            const { stdout } = await execAsync(
                `ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`,
            );
            return JSON.parse(stdout);
        } catch (error) {
            console.error("Error getting video info:", error);
            throw error;
        }
    }
}

export default new VideoProcessingService();
