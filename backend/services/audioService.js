import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class AudioService {
    constructor() {
        this.outputDir = path.join(__dirname, "../temp/audio");
        // Ensure temp directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    sanitizeText(text) {
        return text
            .replace(/\n/g, " ") // Replace newlines with spaces
            .replace(/…/g, "...") // Replace Unicode ellipsis
            .trim();
    }

    async generateSpeech(text, workingDir, voice = "male", language = "en-US") {
        const speechConfig = sdk.SpeechConfig.fromSubscription(
            process.env.SPEECH_KEY,
            process.env.SPEECH_REGION,
        );

        // Configure voice based on gender and language
        const voiceMap = {
            "en-US": {
                male: "en-US-GuyNeural",
                female: "en-US-JennyNeural",
            },
            "it-IT": {
                male: "it-IT-DiegoNeural",
                female: "it-IT-ElsaNeural",
            },
            // Add more language-voice mappings as needed
        };

        speechConfig.speechSynthesisVoiceName =
            voiceMap[language]?.[voice] || voiceMap["en-US"][voice];

        const audioPath = path.join(workingDir, "speech.mp3");
        const audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioPath);

        const synthesizer = new sdk.SpeechSynthesizer(
            speechConfig,
            audioConfig,
        );

        return new Promise((resolve, reject) => {
            synthesizer.speakTextAsync(
                text,
                (result) => {
                    synthesizer.close();
                    resolve(audioPath);
                },
                (error) => {
                    synthesizer.close();
                    reject(error);
                },
            );
        });
    }

    async adjustAudioVolume(inputFile, outputFile, volume = 1.0) {
        try {
            const command = `ffmpeg -i "${inputFile}" -filter:a "volume=${volume}" "${outputFile}"`;
            await execAsync(command);
            return outputFile;
        } catch (error) {
            console.error("Error adjusting audio volume:", error);
            throw error;
        }
    }

    async mixAudioTracks(voiceFile, musicFile, outputFile, musicVolume = 0.3) {
        try {
            // Mix voice and background music using FFmpeg
            const command = `ffmpeg -i "${voiceFile}" -i "${musicFile}" -filter_complex "[1:a]volume=${musicVolume}[music];[0:a][music]amix=inputs=2:duration=longest" "${outputFile}"`;
            await execAsync(command);
            return outputFile;
        } catch (error) {
            console.error("Error mixing audio tracks:", error);
            throw error;
        }
    }

    async getAudioDuration(audioPath) {
        try {
            const { stdout } = await execAsync(
                `"${process.env.FFMPEG_PATH}" -i "${audioPath}" 2>&1 | grep "Duration" | cut -d ' ' -f 4 | sed s/,//`,
            );
            const [hours, minutes, seconds] = stdout
                .trim()
                .split(":")
                .map(Number);
            return hours * 3600 + minutes * 60 + seconds;
        } catch (error) {
            console.error("Error getting audio duration:", error);
            throw error;
        }
    }
}

export default new AudioService();
