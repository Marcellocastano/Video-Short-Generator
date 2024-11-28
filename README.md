# YouTube Shorts Generator

Applicazione automatizzata per la generazione di video per YouTube Shorts.

## Struttura del Progetto

```
.
├── backend/           # Server Node.js
│   ├── controllers/  # Controller delle route
│   ├── services/    # Servizi business logic
│   ├── routes/     # Definizione delle route
│   └── server.js   # Entry point del server
├── frontend/        # Applicazione Vue 3
│   ├── src/        # Codice sorgente
│   ├── public/     # Asset statici
│   └── index.html  # Entry point HTML
└── package.json    # Configurazione del progetto
```

## Requisiti

- Node.js
- FFmpeg
- API Key per Pexels/Pixabay

## Installazione

1. Clona il repository
2. Installa le dipendenze del backend: `npm install`
3. Installa le dipendenze del frontend: `cd frontend && npm install`
4. Crea un file `.env` nella root del progetto con le tue API key

## Sviluppo

- Backend: `npm run dev`
- Frontend: `npm run client`
- Entrambi: `npm run dev:full`
