const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function fixUsersNames() {
  try {
    console.log('🔍 Verifica utenti con nomi incompleti...\n');
    
    // Trova tutti gli utenti
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nome: true,
        cognome: true
      }
    });
    
    console.log(`📊 Totale utenti: ${users.length}\n`);
    
    let usersToFix = [];
    
    users.forEach(user => {
      const hasIssue = !user.nome || !user.cognome || user.nome === 'N/A' || user.cognome === 'N/A';
      if (hasIssue) {
        usersToFix.push(user);
        console.log(`⚠️  Utente con dati incompleti:`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Nome: ${user.nome || 'NULL'}`);
        console.log(`   Cognome: ${user.cognome || 'NULL'}\n`);
      }
    });
    
    if (usersToFix.length === 0) {
      console.log('✅ Tutti gli utenti hanno nomi completi!\n');
      return;
    }
    
    console.log(`🔧 Trovati ${usersToFix.length} utenti da correggere.\n`);
    console.log('📝 Correzione in corso...\n');
    
    for (const user of usersToFix) {
      // Estrai nome dalla email se mancano i dati
      const emailName = user.email.split('@')[0];
      const nome = user.nome && user.nome !== 'N/A' ? user.nome : emailName;
      const cognome = user.cognome && user.cognome !== 'N/A' ? user.cognome : 'Utente';
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          nome: nome,
          cognome: cognome
        }
      });
      
      console.log(`✅ Aggiornato: ${user.email} → ${nome} ${cognome}`);
    }
    
    console.log(`\n✨ Completato! ${usersToFix.length} utenti aggiornati.\n`);
    
  } catch (error) {
    console.error('❌ Errore durante la correzione:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixUsersNames();
