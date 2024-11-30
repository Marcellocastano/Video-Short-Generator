import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { exec } from "child_process";
import { promisify } from "util";
import audioService from "../services/audioService.js";
import subtitleService from "../services/subtitleService.js";
import videoMashupService from "../services/videoMashupService.js";

const execAsync = promisify(exec);
const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Search videos from Pixabay
router.get("/search", async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res
                .status(400)
                .json({ error: "Query parameter is required" });
        }

        const apiKey = process.env.PIXABAY_API_KEY;
        const apiUrl = `https://pixabay.com/api/videos/?key=${apiKey}&q=${encodeURIComponent(query)}&per_page=10`;

        console.log(
            "Searching videos with URL:",
            apiUrl.replace(apiKey, "***"),
        );

        const response = await fetch(apiUrl);
        const data = await response.json();

        // Map the response to include only necessary data
        const videos = data.hits.map((video) => ({
            id: video.id,
            duration: video.duration,
            tags: video.tags,
            preview: video.videos.tiny.url,
            videos: {
                large: video.videos.large,
                medium: video.videos.medium,
                small: video.videos.small,
                tiny: video.videos.tiny,
            },
        }));

        res.json(videos);
    } catch (error) {
        console.error("Error searching videos:", error);
        res.status(500).json({ error: "Failed to search videos" });
    }
});

// Process and combine video components
router.post("/generate", async (req, res) => {
    try {
        const { text, videos, voice, language, backgroundMusic } = req.body;

        if (!text || !videos || !videos.length) {
            return res
                .status(400)
                .json({ error: "Missing required parameters" });
        }

        // Set headers for streaming response
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Transfer-Encoding", "chunked");

        const sendProgress = (progress, step) => {
            res.write(JSON.stringify({ progress, step }) + "\n");
        };

        // Create working directory
        const workingDir = path.join(
            __dirname,
            "../temp",
            Date.now().toString(),
        );
        fs.mkdirSync(workingDir, { recursive: true });

        sendProgress(10, "Generazione audio...");
        // Generate audio from text
        const audioPath = await audioService.generateSpeech(
            text,
            workingDir,
            voice,
            language,
        );
        const audioDuration = await audioService.getAudioDuration(audioPath);

        sendProgress(20, "Download musica di sottofondo...");
        let backgroundMusicPath = null;
        if (backgroundMusic) {
            backgroundMusicPath = path.join(workingDir, "background_music.mp3");
            const musicResponse = await fetch(backgroundMusic);
            const musicBuffer = await musicResponse.buffer();
            fs.writeFileSync(backgroundMusicPath, musicBuffer);
        }

        sendProgress(30, "Normalizzazione audio...");
        // Normalize speech audio
        const normalizedSpeechPath = path.join(
            workingDir,
            "normalized_speech.wav",
        );
        await execAsync(
            `${process.env.FFMPEG_PATH} -i "${audioPath}" -af "volume=2.0" -ar 44100 -ac 2 "${normalizedSpeechPath}"`,
        );

        // If we have background music, mix it with the speech
        const finalAudioPath = path.join(workingDir, "final_audio.wav");
        if (backgroundMusicPath) {
            sendProgress(40, "Mixaggio audio...");
            // First normalize and loop the background music to match speech duration
            const normalizedMusicPath = path.join(
                workingDir,
                "normalized_music.wav",
            );
            await execAsync(
                `${process.env.FFMPEG_PATH} -i "${backgroundMusicPath}" -af "volume=0.5" -ar 44100 -ac 2 "${normalizedMusicPath}"`,
            );

            // Mix speech with background music
            await execAsync(
                `${process.env.FFMPEG_PATH} -i "${normalizedSpeechPath}" -i "${normalizedMusicPath}" -filter_complex "[1:a]aloop=loop=-1:size=2e+09[loop];[loop]apad=whole_dur=${audioDuration}[music];[0:a][music]amix=inputs=2:duration=first:weights=1 0.5[a]" -map "[a]" "${finalAudioPath}"`,
            );
        } else {
            // If no background music, just use the normalized speech
            fs.copyFileSync(normalizedSpeechPath, finalAudioPath);
        }

        sendProgress(50, "Generazione sottotitoli...");
        // Generate subtitles
        const subtitlePath = path.join(workingDir, "subtitles.ass");
        await subtitleService.generateSubtitlesFromText(
            text,
            audioDuration,
            subtitlePath,
        );

        sendProgress(70, "Creazione video mashup...");
        // Create video mashup
        const combinedVideoPath = await videoMashupService.createMashup(
            videos,
            workingDir,
            audioDuration,
        );

        sendProgress(90, "Finalizzazione video...");
        // Combine video with audio and burn subtitles
        const outputPath = path.join(workingDir, "final.mp4");
        await execAsync(
            `${process.env.FFMPEG_PATH} -i "${combinedVideoPath}" -i "${finalAudioPath}" -map 0:v -map 1:a -vf "subtitles=${subtitlePath}" -c:v libx264 -c:a aac -b:a 192k -shortest "${outputPath}"`,
        );

        // Create a URL for the video
        const baseUrl = `http://localhost:${process.env.PORT || 3000}`;
        const videoUrl = `${baseUrl}/temp/${path.basename(workingDir)}/final.mp4`;

        // Make sure the file exists and is accessible
        if (!fs.existsSync(outputPath)) {
            console.error("Video file not found at:", outputPath);
            throw new Error("Generated video file not found");
        }

        console.log("Video file generated successfully at:", outputPath);
        console.log("File size:", fs.statSync(outputPath).size, "bytes");
        console.log("Video URL:", videoUrl);

        // Ensure proper file permissions
        fs.chmodSync(outputPath, 0o644);

        sendProgress(100, "Completato!");
        // Send the video URL
        res.write(JSON.stringify({ videoUrl }) + "\n");
        res.end();

        // Clean up temp files after a longer delay to ensure download completes
        setTimeout(() => {
            fs.rm(workingDir, { recursive: true }, (err) => {
                if (err) console.error("Error cleaning up:", err);
            });
        }, 30000); // Increased to 30 seconds
    } catch (error) {
        console.error("Error generating video:", error);
        res.status(500).json({ error: "Failed to generate video" });
    }
});

export default router;
