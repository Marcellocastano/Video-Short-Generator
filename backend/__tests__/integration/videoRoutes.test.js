import request from 'supertest';
import path from 'path';
import fs from 'fs/promises';
import app from '../../app.js';
import db from '../../database/index.js';

describe('Video Routes', () => {
    beforeEach(async () => {
        // Pulisci il database prima di ogni test
        await db('videos').del();
    });

    afterAll(async () => {
        await db.destroy();
    });

    describe('POST /api/videos', () => {
        it('should upload video successfully', async () => {
            // Assicurati che la directory di test esista
            await fs.mkdir(global.TEST_CONFIG.UPLOAD_DIR, { recursive: true });

            // Crea un file video di test
            const testVideoPath = path.join(
                global.TEST_CONFIG.UPLOAD_DIR,
                'test-video.mp4'
            );
            const fakeVideoContent = Buffer.from('fake video content');
            await fs.writeFile(testVideoPath, fakeVideoContent);

            const response = await request(app)
                .post('/api/videos')
                .field('title', 'Test Video')
                .field('description', 'Test Description')
                .field(
                    'publishAt',
                    new Date(Date.now() + 86400000).toISOString()
                ) // domani
                .field('hashtags', JSON.stringify(['test']))
                .attach('video', testVideoPath, {
                    filename: 'test.mp4',
                    contentType: 'video/mp4',
                });

            // Log della risposta per il debug
            if (response.status !== 201) {
                console.log('Response body:', response.body);
            }

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.videoId).toBeDefined();

            // Cleanup
            try {
                await fs.unlink(testVideoPath);
            } catch (error) {
                console.error('Errore durante la pulizia:', error);
            }
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/videos')
                .field('description', 'Test Description');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });
    });

    describe('GET /api/videos', () => {
        it('should return all videos', async () => {
            // Inserisci alcuni video di test
            await db('videos').insert([
                {
                    title: 'Video 1',
                    file_path: '/test1.mp4',
                    metadata: '{}',
                },
                {
                    title: 'Video 2',
                    file_path: '/test2.mp4',
                    metadata: '{}',
                },
            ]);

            const response = await request(app).get('/api/videos');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.videos).toHaveLength(2);
        });
    });

    describe('GET /api/videos/:id', () => {
        it('should return video by id', async () => {
            const [id] = await db('videos').insert({
                title: 'Test Video',
                file_path: '/test.mp4',
                metadata: '{}',
            });

            const response = await request(app).get(`/api/videos/${id}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.video.title).toBe('Test Video');
        });

        it('should return 404 for non-existent video', async () => {
            const response = await request(app).get('/api/videos/999');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/videos/:id', () => {
        it('should update video successfully', async () => {
            const [id] = await db('videos').insert({
                title: 'Original Title',
                file_path: '/test.mp4',
                metadata: '{}',
            });

            const response = await request(app).put(`/api/videos/${id}`).send({
                title: 'Updated Title',
                description: 'Updated Description',
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            const updated = await db('videos').where('id', id).first();
            expect(updated.title).toBe('Updated Title');
        });
    });

    describe('DELETE /api/videos/:id', () => {
        it('should delete video successfully', async () => {
            const [id] = await db('videos').insert({
                title: 'To Delete',
                file_path: '/test.mp4',
                metadata: '{}',
            });

            const response = await request(app).delete(`/api/videos/${id}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            const deleted = await db('videos').where('id', id).first();
            expect(deleted).toBeUndefined();
        });
    });
});
