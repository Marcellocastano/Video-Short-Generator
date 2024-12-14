import express from 'express';
import musicController from '../controllers/musicController.js';

const router = express.Router();

// Search music from Jamendo
router.get('/search', musicController.searchMusic);

export default router;
