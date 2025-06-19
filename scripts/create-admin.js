const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('Verifica se esiste già un utente admin...');
    
    // Verifica se esiste già un utente con email admin@example.com
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });

    if (existingAdmin) {
      console.log('L\'utente admin esiste già:', existingAdmin.email);
      return existingAdmin;
    }

    // Crea un nuovo utente admin
    console.log('Creazione nuovo utente admin...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        nome: 'Admin',
        cognome: 'User',
        password: hashedPassword,
        role: 'admin'
      }
    });

    console.log('Utente admin creato con successo:', admin.email);
    return admin;
  } catch (error) {
    console.error('Errore durante la creazione dell\'utente admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser()
  .then(() => {
    console.log('Script completato con successo.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Errore nello script:', error);
    process.exit(1);
  });
