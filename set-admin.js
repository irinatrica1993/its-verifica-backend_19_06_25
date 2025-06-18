const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('Connessione al database riuscita!');
    
    // Modifica il ruolo dell'utente con email admin@example.com a "admin"
    const updatedUser = await prisma.user.update({
      where: { email: 'admin@example.com' },
      data: { role: 'admin' }
    });
    
    console.log('Utente aggiornato:', {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role
    });
  } catch (e) {
    console.error('Errore durante l\'aggiornamento:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
