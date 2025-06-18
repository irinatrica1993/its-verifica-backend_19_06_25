const prisma = require('./prisma');

async function main() {
  try {
    // Connessione al database
    console.log('Connessione al database...');
    
    // Creazione di un utente di test
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Utente Test',
        password: 'password123', // In un'app reale, questa dovrebbe essere hashata
        posts: {
          create: {
            title: 'Il mio primo post',
            content: 'Questo è il contenuto del mio primo post.',
            published: true
          }
        }
      },
      include: {
        posts: true
      }
    });
    
    console.log('Utente creato con successo:');
    console.log(JSON.stringify(user, null, 2));
    
    // Recuperare tutti gli utenti
    const allUsers = await prisma.user.findMany({
      include: {
        posts: true
      }
    });
    
    console.log('Tutti gli utenti:');
    console.log(JSON.stringify(allUsers, null, 2));
    
    console.log('Test completato con successo!');
  } catch (error) {
    console.error('Errore durante il test del database:', error);
  } finally {
    // Chiudere la connessione al database
    await prisma.$disconnect();
  }
}

main();
