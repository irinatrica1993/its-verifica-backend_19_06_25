const { PrismaClient } = require('@prisma/client');

// Usa l'URL del database dall'ambiente o un valore di fallback
// Utilizziamo lo stesso URL che funziona su Railway
const DATABASE_URL = process.env.DATABASE_URL || 'mongodb+srv://irinatrica140:Cassiere01@cluster0.2ik5jax.mongodb.net/its-verifica-db?retryWrites=true&w=majority&appName=Cluster0';

// Stampa informazioni di debug sulla connessione
console.log('Ambiente:', process.env.NODE_ENV || 'development');
console.log('Connessione al database (mascherata):', DATABASE_URL.replace(/:\/\/([^:]+):[^@]+@/, '://$1:****@'));
console.log('Tentativo di connessione al database...');

// Configurazione del client Prisma con timeout più lungo per la connessione
const prismaOptions = {
  log: ['query', 'error', 'warn'],
  errorFormat: 'pretty',
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
  // Aggiungiamo opzioni specifiche per MongoDB
  __internal: {
    engine: {
      connectTimeout: 60000, // 60 secondi di timeout per la connessione
      queryTimeout: 60000,   // 60 secondi di timeout per le query
    },
  },
};

// Gestione delle connessioni in ambiente serverless
// In ambiente serverless, è importante riutilizzare le connessioni
const globalForPrisma = global;

// Utilizziamo una variabile globale per mantenere la connessione tra le invocazioni
let prisma;

// Verifica se esiste già un'istanza di PrismaClient
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient(prismaOptions);
} else {
  // In sviluppo, riutilizziamo la connessione esistente
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient(prismaOptions);
  }
  prisma = globalForPrisma.prisma;
}

// Gestione degli errori di connessione
prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Params: ' + e.params);
  console.log('Duration: ' + e.duration + 'ms');
});

prisma.$on('error', (e) => {
  console.error('Prisma Error:', e);
});

// Funzione per testare la connessione al database
const testConnection = async () => {
  try {
    console.log('Tentativo di connessione al database...');
    await prisma.$connect();
    console.log('Connessione al database riuscita!');
    return true;
  } catch (error) {
    console.error('Errore di connessione al database:', error);
    return false;
  }
};

// Esegui il test di connessione all'avvio
testConnection();

module.exports = prisma;
