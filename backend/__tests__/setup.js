import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import db from '../../backend/database/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione globale per Jest
global.TEST_CONFIG = {
  UPLOAD_DIR: path.join(__dirname, 'fixtures/uploads'),
  TEST_VIDEO_PATH: path.join(__dirname, 'fixtures/test-video.mp4'),
  DB_PATH: path.join(__dirname, 'fixtures/test.sqlite3')
};

// Setup prima di tutti i test
beforeAll(async () => {
  // Crea directory per upload se non esiste
  await fs.mkdir(global.TEST_CONFIG.UPLOAD_DIR, { recursive: true });
  
  // Inizializza il database di test
  const initSql = await fs.readFile(path.join(__dirname, 'fixtures/init.sql'), 'utf8');
  await db.raw(initSql);
});

// Cleanup dopo ogni test
afterEach(async () => {
  // Pulisci directory upload
  const files = await fs.readdir(global.TEST_CONFIG.UPLOAD_DIR);
  await Promise.all(
    files.map(file => 
      fs.unlink(path.join(global.TEST_CONFIG.UPLOAD_DIR, file))
    )
  );
  
  // Pulisci database
  await db('videos').del();
});

// Cleanup finale
afterAll(async () => {
  await db.destroy();
});
