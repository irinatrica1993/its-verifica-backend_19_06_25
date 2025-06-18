const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('Connessione al database riuscita!');
    
    const usersCount = await prisma.user.count();
    console.log(`Numero di utenti nel database: ${usersCount}`);
    
    const users = await prisma.user.findMany();
    console.log('Utenti:', users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role
    })));
  } catch (e) {
    console.error('Errore di connessione al database:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
