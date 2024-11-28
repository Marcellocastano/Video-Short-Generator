import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root directory
dotenv.config({ path: path.join(dirname(__dirname), ".env") });

// Verifica che le variabili d'ambiente siano caricate
console.log("Environment variables loaded:", {
    PORT: process.env.PORT,
    PIXABAY_API_KEY: process.env.PIXABAY_API_KEY ? "***" : undefined,
    FFMPEG_PATH: process.env.FFMPEG_PATH,
    TEMP_DIR: process.env.TEMP_DIR,
});

const app = express();

// Enable CORS for all routes
app.use(cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Serve static files from temp directory
app.use("/temp", express.static(tempDir));

// Import routes
import videosRouter from "./routes/videos.js";
import audioRouter from "./routes/audio.js";
import subtitlesRouter from "./routes/subtitles.js";
import musicRouter from "./routes/music.js";

// Routes
app.use("/api/videos", videosRouter);
app.use("/api/audio", audioRouter);
app.use("/api/subtitles", subtitlesRouter);
app.use("/api/music", musicRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
