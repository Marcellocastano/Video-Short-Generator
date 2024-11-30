import knex from 'knex';
import config from '../knexfile.js';

const db = knex(config.development);

async function initDatabase() {
    try {
        // Esegui le migrazioni
        await db.migrate.latest();
        console.log('Database inizializzato con successo!');
    } catch (error) {
        console.error("Errore durante l'inizializzazione del database:", error);
    } finally {
        await db.destroy();
    }
}

initDatabase();
