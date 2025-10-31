const express = require('express');
const cors = require('cors');
require('dotenv').config();
const prisma = require('./src/prisma');
const { ensureAdminExists } = require('./src/utils/ensureAdmin');

// Importa le rotte
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const eventoRoutes = require('./src/routes/eventoRoutes');
const iscrizioneRoutes = require('./src/routes/iscrizioneRoutes');

const app = express();
const PORT = process.env.PORT || 3000; // Cambiato da 5000 a 3000 perché la porta 5000 è già in uso

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Log delle richieste per il debug
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Body:', req.body);
  next();
});

// Verifica che JWT_SECRET sia definito
if (!process.env.JWT_SECRET) {
  console.warn('ATTENZIONE: JWT_SECRET non è definito. Usando un valore predefinito per lo sviluppo.');
  process.env.JWT_SECRET = 'its-verifica-secret-key-dev';
}

// Routes
app.get('/api', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ message: 'API funzionante! Connessione al database stabilita.' });
  } catch (error) {
    console.error('Errore di connessione al database:', error);
    res.status(500).json({ message: 'Errore di connessione al database', error: error.message });
  }
});

// Rotte API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/eventi', eventoRoutes);
app.use('/api/iscrizioni', iscrizioneRoutes);

// Middleware per la gestione degli errori
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Si è verificato un errore interno del server',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// Funzione per inizializzare il server
async function startServer() {
  try {
    console.log('🚀 Avvio del server...');
    
    // Verifica connessione al database
    console.log('📊 Connessione al database...');
    await prisma.$connect();
    console.log('✅ Connessione al database stabilita');
    
    // Assicura che l'admin esista prima di avviare il server
    console.log('👤 Verifica admin di sistema...');
    await ensureAdminExists();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Server in esecuzione sulla porta ${PORT}`);
      console.log(`📍 API disponibile su: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Errore durante l\'avvio del server:', error);
    process.exit(1);
  }
}

// Gestione della chiusura del server
process.on('SIGINT', async () => {
  console.log('\n🛑 Chiusura del server...');
  await prisma.$disconnect();
  console.log('✅ Disconnessione dal database completata');
  process.exit(0);
});

// Avvia il server
startServer();
