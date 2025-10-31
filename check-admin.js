const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    console.log('🔍 Verifica utenti nel database...\n');
    
    // Conta tutti gli utenti
    const totalUsers = await prisma.user.count();
    console.log(`📊 Totale utenti: ${totalUsers}\n`);
    
    // Cerca utenti admin
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        email: true,
        nome: true,
        cognome: true,
        role: true,
        createdAt: true
      }
    });
    
    if (admins.length > 0) {
      console.log('👑 Utenti Admin trovati:\n');
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. Email: ${admin.email}`);
        console.log(`   Nome: ${admin.nome || 'N/A'} ${admin.cognome || 'N/A'}`);
        console.log(`   ID: ${admin.id}`);
        console.log(`   Creato: ${admin.createdAt.toLocaleString('it-IT')}\n`);
      });
    } else {
      console.log('❌ Nessun admin trovato nel database.\n');
      console.log('💡 Suggerimento: Il primo utente che si registra diventa automaticamente admin.\n');
    }
    
    // Cerca l'admin specifico con email admin@example.com
    const specificAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });
    
    if (specificAdmin) {
      console.log('✅ L\'admin con email "admin@example.com" esiste!\n');
      console.log('🔐 Credenziali di login:');
      console.log('   Email: admin@example.com');
      console.log('   Password: password123 (se non è stata cambiata)\n');
    } else {
      console.log('⚠️  L\'admin con email "admin@example.com" NON esiste.\n');
      console.log('📝 Per crearlo, registra un nuovo utente con:');
      console.log('   Email: admin@example.com');
      console.log('   Password: password123');
      console.log('   Nome: Admin Example (o qualsiasi nome)\n');
    }
    
  } catch (error) {
    console.error('❌ Errore durante la verifica:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
