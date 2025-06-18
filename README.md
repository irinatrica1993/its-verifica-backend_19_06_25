# ITS Verifica Backend

Backend per l'applicazione di verifica ITS, sviluppato con Express.js e MongoDB (Prisma ORM).

## Caratteristiche

- Sistema di autenticazione JWT
- Gestione ruoli (utente normale e admin)
- API RESTful per la gestione degli utenti
- Connessione a MongoDB tramite Prisma ORM
- Middleware per la protezione delle rotte

## Struttura del progetto

```
its-verifica-backend/
├── prisma/
│   └── schema.prisma      # Schema del database
├── src/
│   ├── controllers/       # Controller per le rotte
│   ├── middleware/        # Middleware personalizzati
│   ├── routes/            # Definizione delle rotte API
│   └── prisma.js          # Client Prisma
├── .env                   # Variabili d'ambiente
├── index.js               # Entry point dell'applicazione
└── package.json           # Dipendenze e script
```

## Installazione

```bash
# Installazione delle dipendenze
npm install

# Configurazione del database
npx prisma generate

# Avvio del server in modalità sviluppo
npm run dev
```

## API Endpoints

### Autenticazione

- `POST /api/auth/register` - Registrazione nuovo utente
- `POST /api/auth/login` - Login utente
- `GET /api/auth/profile` - Profilo utente (richiede autenticazione)

### Gestione utenti

- `GET /api/users` - Lista utenti (solo admin)
- `GET /api/users/:id` - Dettagli utente (admin o stesso utente)
- `PUT /api/users/:id` - Aggiornamento utente (admin o stesso utente)
- `DELETE /api/users/:id` - Eliminazione utente (solo admin)

## Variabili d'ambiente

```
PORT=3000
DATABASE_URL=mongodb://...
JWT_SECRET=your_jwt_secret
```

## Licenza

MIT
