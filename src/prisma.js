const { PrismaClient } = require('@prisma/client');

// Gestione delle connessioni in ambiente serverless
// In ambiente serverless, è importante riutilizzare le connessioni
const globalForPrisma = global;

// Utilizziamo una variabile globale per mantenere la connessione tra le invocazioni
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
  errorFormat: 'pretty',
});

// Solo in ambiente di sviluppo assegniamo prisma alla variabile globale
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Gestione degli errori di connessione
prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Params: ' + e.params);
  console.log('Duration: ' + e.duration + 'ms');
});

prisma.$on('error', (e) => {
  console.error('Prisma Error:', e);
});

module.exports = prisma;
