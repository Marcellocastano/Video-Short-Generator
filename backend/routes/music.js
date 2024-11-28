import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// Search music from Jamendo
router.get("/search", async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res
                .status(400)
                .json({ error: "Query parameter is required" });
        }

        const clientId = process.env.JAMENDO_CLIENT_ID;
        if (!clientId) {
            return res
                .status(500)
                .json({ error: "Jamendo client ID not configured" });
        }

        // Jamendo API endpoint for track search
        // Docs: https://developer.jamendo.com/v3.0/tracks
        const apiUrl =
            `https://api.jamendo.com/v3.0/tracks/?` +
            new URLSearchParams({
                client_id: clientId,
                format: "json",
                limit: "50",
                namesearch: query,
                include: "musicinfo",
                audioformat: "mp32",
                speed: "medium", // Valori corretti per la velocità
                boost: "popularity_month",
                groupby: "artist_id",
            });

        console.log(
            "Searching music with URL:",
            apiUrl.replace(clientId, "***"),
        );

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok || data.headers?.status === "failed") {
            console.error("API response error:", data.headers);
            return res.status(500).json({
                error: "API request failed",
                details: data.headers?.error_message,
            });
        }

        console.log("API Response headers:", data.headers);
        console.log("Results count:", data.results?.length || 0);

        if (!data.results) {
            console.error("Invalid API response:", data);
            return res.status(500).json({ error: "Invalid API response" });
        }

        // Map the response to our format
        const tracks = data.results.map((track) => ({
            id: track.id,
            title: track.name,
            artist: track.artist_name,
            duration: Math.floor(track.duration || 0),
            preview_url: track.audio,
            download_url: track.audio,
            tags: track.tags?.join(", ") || "",
            license: track.license_ccurl,
        }));

        console.log("Processed tracks:", tracks.length);
        res.json(tracks);
    } catch (error) {
        console.error("Error searching music:", error);
        res.status(500).json({ error: "Failed to search music" });
    }
});

export default router;
