const prisma = require('../prisma');

// Funzione per gestire gli errori in modo consistente
const handleError = (res, error, message) => {
  console.error(`Errore: ${message}`, error);
  return res.status(500).json({ 
    message, 
    error: process.env.NODE_ENV === 'development' ? error.message : undefined 
  });
};

// Verifica se è possibile iscriversi/disiscriversi (fino al giorno prima dell'evento)
const verificaDataIscrizione = async (eventoId) => {
  const evento = await prisma.evento.findUnique({
    where: { id: eventoId }
  });

  if (!evento) {
    throw new Error('Evento non trovato');
  }

  // Calcola la data limite (mezzanotte del giorno prima dell'evento)
  const dataEvento = new Date(evento.data);
  const dataLimite = new Date(dataEvento);
  dataLimite.setDate(dataLimite.getDate() - 1);
  dataLimite.setHours(23, 59, 59, 999);

  const oggi = new Date();
  
  if (oggi > dataLimite) {
    throw new Error('Non è più possibile iscriversi o disiscriversi a questo evento');
  }

  return evento;
};

// Ottieni tutte le iscrizioni dell'utente corrente
const getIscrizioniUtente = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const iscrizioni = await prisma.iscrizione.findMany({
      where: {
        userId: userId
      },
      include: {
        evento: true
      },
      orderBy: {
        evento: {
          data: 'asc'
        }
      }
    });
    
    res.json(iscrizioni);
  } catch (error) {
    return handleError(res, error, 'Errore durante il recupero delle iscrizioni');
  }
};

// Ottieni tutte le iscrizioni per un evento specifico (solo organizzatori)
const getIscrizioniEvento = async (req, res) => {
  try {
    const { eventoId } = req.params;
    
    const iscrizioni = await prisma.iscrizione.findMany({
      where: {
        eventoId
      },
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            email: true
          }
        }
      },
      orderBy: {
        user: {
          cognome: 'asc'
        }
      }
    });
    
    res.json(iscrizioni);
  } catch (error) {
    return handleError(res, error, 'Errore durante il recupero delle iscrizioni per l\'evento');
  }
};

// Crea una nuova iscrizione
const createIscrizione = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { eventoId } = req.body;
    
    if (!eventoId) {
      return res.status(400).json({ message: 'ID evento richiesto' });
    }
    
    // Verifica se l'evento esiste e se è possibile iscriversi
    try {
      await verificaDataIscrizione(eventoId);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
    
    // Verifica se l'utente è già iscritto all'evento
    const iscrizioneEsistente = await prisma.iscrizione.findFirst({
      where: {
        userId: userId,
        eventoId
      }
    });
    
    if (iscrizioneEsistente) {
      return res.status(400).json({ message: 'Sei già iscritto a questo evento' });
    }
    
    // Crea l'iscrizione
    const iscrizione = await prisma.iscrizione.create({
      data: {
        userId: userId,
        eventoId,
        checkinEffettuato: false
      },
      include: {
        evento: true
      }
    });
    
    res.status(201).json(iscrizione);
  } catch (error) {
    return handleError(res, error, 'Errore durante la creazione dell\'iscrizione');
  }
};

// Elimina un'iscrizione (disiscrizione)
const deleteIscrizione = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    
    // Trova l'iscrizione
    const iscrizione = await prisma.iscrizione.findUnique({
      where: { id },
      include: { evento: true }
    });
    
    if (!iscrizione) {
      return res.status(404).json({ message: 'Iscrizione non trovata' });
    }
    
    // Verifica se l'utente è il proprietario dell'iscrizione
    if (iscrizione.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non sei autorizzato a eliminare questa iscrizione' });
    }
    
    // Verifica se è possibile disiscriversi
    try {
      await verificaDataIscrizione(iscrizione.eventoId);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
    
    // Elimina l'iscrizione
    await prisma.iscrizione.delete({
      where: { id }
    });
    
    res.json({ message: 'Iscrizione eliminata con successo' });
  } catch (error) {
    return handleError(res, error, 'Errore durante l\'eliminazione dell\'iscrizione');
  }
};

// Registra il check-in per un'iscrizione (solo organizzatori)
const registraCheckin = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Trova l'iscrizione
    const iscrizione = await prisma.iscrizione.findUnique({
      where: { id },
      include: { evento: true }
    });
    
    if (!iscrizione) {
      return res.status(404).json({ message: 'Iscrizione non trovata' });
    }
    
    // Aggiorna l'iscrizione con il check-in
    const iscrizioneAggiornata = await prisma.iscrizione.update({
      where: { id },
      data: {
        checkinEffettuato: true,
        oraCheckin: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            email: true
          }
        },
        evento: true
      }
    });
    
    res.json(iscrizioneAggiornata);
  } catch (error) {
    return handleError(res, error, 'Errore durante la registrazione del check-in');
  }
};

module.exports = {
  getIscrizioniUtente,
  getIscrizioniEvento,
  createIscrizione,
  deleteIscrizione,
  registraCheckin
};
