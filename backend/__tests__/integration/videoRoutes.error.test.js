import request from 'supertest';
import path from 'path';
import fs from 'fs/promises';
import app from '../../app.js';
import db from '../../database/index.js';

describe('Video Routes Error Handling', () => {
    beforeEach(async () => {
        await db('videos').del();
    });

    afterAll(async () => {
        await db.destroy();
    });

    describe('POST /api/videos validation errors', () => {
        it('should handle missing video file', async () => {
            const response = await request(app)
                .post('/api/videos')
                .field('title', 'Test Video');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain(
                'Nessun file video caricato'
            );
        });

        it('should handle invalid file type', async () => {
            const testFilePath = path.join(
                global.TEST_CONFIG.UPLOAD_DIR,
                'test.txt'
            );
            await fs.writeFile(testFilePath, 'not a video');

            const response = await request(app)
                .post('/api/videos')
                .field('title', 'Test Video')
                .attach('video', testFilePath);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain(
                'Tipo di file non supportato'
            );
        });

        it('should handle invalid publish date', async () => {
            const testVideoPath = global.TEST_CONFIG.TEST_VIDEO_PATH;
            await fs.writeFile(testVideoPath, 'fake video content');

            const response = await request(app)
                .post('/api/videos')
                .field('title', 'Test Video')
                .field('publishAt', 'invalid-date')
                .attach('video', testVideoPath);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toContainEqual(
                expect.objectContaining({
                    path: 'publishAt',
                })
            );
        });

        it('should handle malformed JSON in hashtags', async () => {
            const testVideoPath = global.TEST_CONFIG.TEST_VIDEO_PATH;
            await fs.writeFile(testVideoPath, 'fake video content');

            const response = await request(app)
                .post('/api/videos')
                .field('title', 'Test Video')
                .field('hashtags', '{invalid json}')
                .attach('video', testVideoPath);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });
    });

    describe('GET /api/videos/:id error cases', () => {
        it('should handle non-numeric id', async () => {
            const response = await request(app).get('/api/videos/not-a-number');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });

        it('should handle very large id', async () => {
            const response = await request(app).get(
                `/api/videos/${Number.MAX_SAFE_INTEGER + 1}`
            );

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/videos/:id error cases', () => {
        it('should handle empty update data', async () => {
            const [id] = await db('videos').insert({
                title: 'Test Video',
                file_path: '/test.mp4',
                metadata: '{}',
            });

            const response = await request(app)
                .put(`/api/videos/${id}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should handle invalid metadata format', async () => {
            // Prima creiamo un video valido
            const [id] = await db('videos').insert({
                title: 'Test Video',
                file_path: '/test.mp4',
                metadata: '{}',
            });

            const response = await request(app).put(`/api/videos/${id}`).send({
                title: 'Updated Title',
                metadata: 'invalid-json',
            });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });
    });

    describe('DELETE /api/videos/:id error cases', () => {
        it('should handle deletion of already deleted video', async () => {
            const [id] = await db('videos').insert({
                title: 'Test Video',
                file_path: '/test.mp4',
                metadata: '{}',
            });

            await request(app).delete(`/api/videos/${id}`);
            const secondResponse = await request(app).delete(
                `/api/videos/${id}`
            );

            expect(secondResponse.status).toBe(404);
            expect(secondResponse.body.success).toBe(false);
        });

        it('should handle missing file during deletion', async () => {
            const [id] = await db('videos').insert({
                title: 'Test Video',
                file_path: '/nonexistent/test.mp4',
                metadata: '{}',
            });

            const response = await request(app).delete(`/api/videos/${id}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('GET /api/videos/:id/stream error cases', () => {
        it('should handle non-existent file', async () => {
            const [id] = await db('videos').insert({
                title: 'Test Video',
                file_path: '/nonexistent/test.mp4',
                metadata: '{}',
            });

            const response = await request(app).get(`/api/videos/${id}/stream`);

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });

        it('should handle invalid range header', async () => {
            const testVideoPath = global.TEST_CONFIG.TEST_VIDEO_PATH;
            await fs.writeFile(testVideoPath, 'fake video content');

            const [id] = await db('videos').insert({
                title: 'Test Video',
                file_path: testVideoPath,
                metadata: '{}',
            });

            const response = await request(app)
                .get(`/api/videos/${id}/stream`)
                .set('Range', 'invalid-range');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });
});
