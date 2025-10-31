const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔐 Creazione nuovo admin...\n');
    
    const email = 'admin@example.com';
    const password = 'password123';
    const nome = 'Admin';
    const cognome = 'Sistema';
    
    // Verifica se l'admin esiste già
    const existingAdmin = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingAdmin) {
      console.log('⚠️  Un utente con questa email esiste già.');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Ruolo: ${existingAdmin.role}\n`);
      
      // Aggiorna la password
      console.log('🔄 Aggiornamento password...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      const updated = await prisma.user.update({
        where: { email },
        data: { 
          password: hashedPassword,
          role: 'admin',
          nome: nome,
          cognome: cognome
        }
      });
      
      console.log('✅ Utente aggiornato con successo!\n');
      console.log('🔐 Credenziali di accesso:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log(`   Ruolo: ${updated.role}\n`);
    } else {
      // Crea nuovo admin
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      const admin = await prisma.user.create({
        data: {
          email,
          nome,
          cognome,
          password: hashedPassword,
          role: 'admin'
        }
      });
      
      console.log('✅ Admin creato con successo!\n');
      console.log('🔐 Credenziali di accesso:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Ruolo: ${admin.role}\n`);
    }
    
    console.log('💡 Ora puoi accedere usando il pulsante "Accedi come Admin" nella pagina di login.\n');
    
  } catch (error) {
    console.error('❌ Errore durante la creazione dell\'admin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
