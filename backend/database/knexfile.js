import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
    development: {
        client: 'sqlite3',
        connection: {
            filename: path.join(__dirname, 'dev.sqlite3'),
        },
        useNullAsDefault: true,
    },
    test: {
        client: 'sqlite3',
        connection: {
            filename: path.join(
                __dirname,
                '../../backend/__tests__/fixtures/test.sqlite3'
            ),
        },
        useNullAsDefault: true,
        migrations: {
            directory: path.join(__dirname, 'migrations'),
        },
    },
};

export default config;
