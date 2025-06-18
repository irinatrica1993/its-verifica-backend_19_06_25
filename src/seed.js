const bcrypt = require('bcryptjs');
const prisma = require('./prisma');

async function seed() {
  try {
    console.log('Inizializzazione del database...');
    
    // Verifica se esiste già un utente con l'email admin@example.com
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });
    
    if (!existingAdmin) {
      // Crea un utente admin predefinito
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      const admin = await prisma.user.create({
        data: {
          name: 'Amministratore',
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'admin'
        }
      });
      
      console.log('Utente admin predefinito creato con successo:', admin.email);
    } else {
      console.log('Utente admin predefinito già esistente:', existingAdmin.email);
    }
    
    console.log('Inizializzazione del database completata.');
  } catch (error) {
    console.error('Errore durante l\'inizializzazione del database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui la funzione seed
seed();
