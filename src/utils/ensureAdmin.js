const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

/**
 * Assicura che esista sempre un admin con credenziali fisse nel database
 */
async function ensureAdminExists() {
  try {
    const ADMIN_EMAIL = 'admin@example.com';
    const ADMIN_PASSWORD = 'password123';
    const ADMIN_NOME = 'Admin';
    const ADMIN_COGNOME = 'Sistema';

    // Verifica se l'admin esiste già
    const existingAdmin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL }
    });

    if (existingAdmin) {
      console.log('✅ Admin già esistente:', ADMIN_EMAIL);
      
      // Verifica che abbia il ruolo admin
      if (existingAdmin.role !== 'admin') {
        await prisma.user.update({
          where: { email: ADMIN_EMAIL },
          data: { role: 'admin' }
        });
        console.log('✅ Ruolo admin aggiornato per:', ADMIN_EMAIL);
      }
      
      return existingAdmin;
    }

    // Crea l'admin se non esiste
    console.log('🔧 Creazione admin di sistema...');
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    const admin = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        nome: ADMIN_NOME,
        cognome: ADMIN_COGNOME,
        password: hashedPassword,
        role: 'admin'
      }
    });

    console.log('✅ Admin di sistema creato con successo!');
    console.log('   Email:', ADMIN_EMAIL);
    console.log('   Password:', ADMIN_PASSWORD);
    console.log('   ID:', admin.id);

    return admin;
  } catch (error) {
    console.error('❌ Errore durante la verifica/creazione admin:', error.message);
    throw error;
  }
}

module.exports = { ensureAdminExists };
