import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';

const execAsync = promisify(exec);

class VideoMashupService {
    async createMashup(videos, workingDir, audioDuration) {
        try {
            console.log('Processing videos...');
            // First, process all videos to the same format
            const processedVideos = await Promise.all(
                videos.map((video, index) =>
                    this.processVideo(video, workingDir, index)
                )
            );

            // Calculate individual video duration and create segments
            const segmentDuration = audioDuration / videos.length;
            console.log('Target segment duration:', segmentDuration);

            console.log('Creating video segments...');
            const segments = [];
            for (let i = 0; i < processedVideos.length; i++) {
                const segment = await this.createSegment(
                    processedVideos[i],
                    workingDir,
                    i,
                    segmentDuration
                );
                segments.push(segment);
            }

            // Create the concat file for sequential playback
            console.log('Creating concat file...');
            const concatFile = path.join(workingDir, 'concat.txt');
            const concatContent = segments
                .map(segment => `file '${path.resolve(segment)}'`)
                .join('\n');
            fs.writeFileSync(concatFile, concatContent);

            // Combine all segments with precise timing
            console.log('Combining segments...');
            const outputPath = path.join(workingDir, 'combined.mp4');
            await execAsync(
                `"${process.env.FFMPEG_PATH}" -f concat -safe 0 -i "${concatFile}" -c:v libx264 -preset medium -r 30 -t ${audioDuration} "${outputPath}"`
            );

            // Verify the output duration
            const { stdout: durationStr } = await execAsync(
                `"${process.env.FFMPEG_PATH}" -i "${outputPath}" 2>&1 | grep "Duration" | cut -d ' ' -f 4 | sed s/,//`
            );
            const [hours, minutes, seconds] = durationStr
                .trim()
                .split(':')
                .map(Number);
            const outputDuration = hours * 3600 + minutes * 60 + seconds;
            console.log('Output video duration:', outputDuration);
            console.log('Target audio duration:', audioDuration);

            return outputPath;
        } catch (error) {
            console.error('Error in createMashup:', error);
            throw error;
        }
    }

    async processVideo(videoUrl, workingDir, index) {
        try {
            // Download video
            const videoPath = path.join(workingDir, `raw_video_${index}.mp4`);
            const videoResponse = await fetch(videoUrl);
            const arrayBuffer = await videoResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            fs.writeFileSync(videoPath, buffer);

            // Process video to vertical format with explicit output format
            const processedPath = path.join(
                workingDir,
                `processed_${index}.mp4`
            );
            await execAsync(
                `"${process.env.FFMPEG_PATH}" -i "${videoPath}" -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -c:v libx264 -preset medium -r 30 "${processedPath}"`
            );

            // Verify the file exists and has proper permissions
            fs.chmodSync(processedPath, 0o644);

            return processedPath;
        } catch (error) {
            console.error(`Error processing video ${index}:`, error);
            throw error;
        }
    }

    async createSegment(videoPath, workingDir, index, duration) {
        try {
            const segmentPath = path.join(workingDir, `segment_${index}.mp4`);

            // Get video duration
            const { stdout: durationStr } = await execAsync(
                `"${process.env.FFMPEG_PATH}" -i "${videoPath}" 2>&1 | grep "Duration" | cut -d ' ' -f 4 | sed s/,//`
            );
            const [hours, minutes, seconds] = durationStr
                .trim()
                .split(':')
                .map(Number);
            const videoDuration = hours * 3600 + minutes * 60 + seconds;

            // Calculate loop count if video is shorter than desired duration
            const loopCount = Math.ceil(duration / videoDuration);

            // Create segment with loop if needed
            if (loopCount > 1) {
                await execAsync(
                    `"${process.env.FFMPEG_PATH}" -stream_loop ${loopCount - 1} -i "${videoPath}" -t ${duration} -c:v libx264 -preset medium -r 30 "${segmentPath}"`
                );
            } else {
                await execAsync(
                    `"${process.env.FFMPEG_PATH}" -i "${videoPath}" -t ${duration} -c:v libx264 -preset medium -r 30 "${segmentPath}"`
                );
            }

            return segmentPath;
        } catch (error) {
            console.error(`Error creating segment ${index}:`, error);
            throw error;
        }
    }

    createFilterComplex(videoCount) {
        if (videoCount === 1) return '';

        const splits = Array(videoCount)
            .fill(0)
            .map((_, i) => `[${i}:v]`)
            .join('');

        return `${splits}xstack=inputs=${videoCount}:layout=0_0|w0_0|0_h0|w0_h0[v]`;
    }
}

export default new VideoMashupService();
