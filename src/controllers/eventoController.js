const prisma = require('../prisma');

// Funzione per gestire gli errori in modo consistente
const handleError = (res, error, message) => {
  console.error(`Errore: ${message}`, error);
  return res.status(500).json({ 
    message, 
    error: process.env.NODE_ENV === 'development' ? error.message : undefined 
  });
};

// Ottieni tutti gli eventi
const getAllEventi = async (req, res) => {
  try {
    // Ottieni parametri di query per filtri opzionali
    const { dataInizio, dataFine } = req.query;
    
    // Costruisci il filtro in base ai parametri
    let where = {};
    
    if (dataInizio || dataFine) {
      where.data = {};
      if (dataInizio) {
        where.data.gte = new Date(dataInizio);
      }
      if (dataFine) {
        where.data.lte = new Date(dataFine);
      }
    }
    
    // Ottieni gli eventi dal database
    const eventi = await prisma.evento.findMany({
      where,
      orderBy: {
        data: 'asc',
      },
    });
    
    res.json(eventi);
  } catch (error) {
    return handleError(res, error, 'Errore durante il recupero degli eventi');
  }
};

// Ottieni un evento specifico per ID
const getEventoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const evento = await prisma.evento.findUnique({
      where: { id },
      include: {
        iscrizioni: {
          include: {
            user: {
              select: {
                id: true,
                nome: true,
                cognome: true,
                email: true
              }
            }
          }
        }
      }
    });
    
    if (!evento) {
      return res.status(404).json({ message: 'Evento non trovato' });
    }
    
    res.json(evento);
  } catch (error) {
    return handleError(res, error, 'Errore durante il recupero dell\'evento');
  }
};

// Crea un nuovo evento (solo organizzatori)
const createEvento = async (req, res) => {
  try {
    const { titolo, data, descrizione } = req.body;
    
    // Validazione dei dati
    if (!titolo || !data || !descrizione) {
      return res.status(400).json({ message: 'Titolo, data e descrizione sono obbligatori' });
    }
    
    // Crea l'evento
    const evento = await prisma.evento.create({
      data: {
        titolo,
        data: new Date(data),
        descrizione
      }
    });
    
    res.status(201).json(evento);
  } catch (error) {
    return handleError(res, error, 'Errore durante la creazione dell\'evento');
  }
};

// Aggiorna un evento esistente (solo organizzatori)
const updateEvento = async (req, res) => {
  try {
    const { id } = req.params;
    const { titolo, data, descrizione } = req.body;
    
    // Verifica se l'evento esiste
    const eventoEsistente = await prisma.evento.findUnique({
      where: { id }
    });
    
    if (!eventoEsistente) {
      return res.status(404).json({ message: 'Evento non trovato' });
    }
    
    // Aggiorna l'evento
    const eventoAggiornato = await prisma.evento.update({
      where: { id },
      data: {
        titolo: titolo || eventoEsistente.titolo,
        data: data ? new Date(data) : eventoEsistente.data,
        descrizione: descrizione || eventoEsistente.descrizione
      }
    });
    
    res.json(eventoAggiornato);
  } catch (error) {
    return handleError(res, error, 'Errore durante l\'aggiornamento dell\'evento');
  }
};

// Elimina un evento (solo organizzatori)
const deleteEvento = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verifica se l'evento esiste
    const eventoEsistente = await prisma.evento.findUnique({
      where: { id }
    });
    
    if (!eventoEsistente) {
      return res.status(404).json({ message: 'Evento non trovato' });
    }
    
    // Elimina l'evento (le iscrizioni associate verranno eliminate automaticamente grazie alla relazione onDelete: Cascade)
    await prisma.evento.delete({
      where: { id }
    });
    
    res.json({ message: 'Evento eliminato con successo' });
  } catch (error) {
    return handleError(res, error, 'Errore durante l\'eliminazione dell\'evento');
  }
};

// Ottieni statistiche degli eventi passati (solo organizzatori)
const getStatisticheEventi = async (req, res) => {
  try {
    const { dataInizio, dataFine } = req.query;
    
    // Costruisci il filtro per gli eventi passati
    let where = {
      data: { lt: new Date() } // Solo eventi passati (data < oggi)
    };
    
    // Aggiungi filtri opzionali per data
    if (dataInizio || dataFine) {
      if (dataInizio) {
        where.data.gte = new Date(dataInizio);
      }
      if (dataFine) {
        where.data.lte = new Date(dataFine);
      }
    }
    
    // Ottieni gli eventi passati con le relative iscrizioni
    const eventiPassati = await prisma.evento.findMany({
      where,
      include: {
        iscrizioni: true
      },
      orderBy: {
        data: 'desc'
      }
    });
    
    // Calcola le statistiche per ogni evento
    const statistiche = eventiPassati.map(evento => {
      const totaleIscritti = evento.iscrizioni.length;
      const totalePresenti = evento.iscrizioni.filter(i => i.checkinEffettuato).length;
      const percentualePresenza = totaleIscritti > 0 ? (totalePresenti / totaleIscritti) * 100 : 0;
      
      return {
        id: evento.id,
        titolo: evento.titolo,
        data: evento.data,
        descrizione: evento.descrizione,
        totaleIscritti,
        totalePresenti,
        percentualePresenza: Math.round(percentualePresenza * 100) / 100 // Arrotonda a 2 decimali
      };
    });
    
    res.json(statistiche);
  } catch (error) {
    return handleError(res, error, 'Errore durante il recupero delle statistiche degli eventi');
  }
};

module.exports = {
  getAllEventi,
  getEventoById,
  createEvento,
  updateEvento,
  deleteEvento,
  getStatisticheEventi
};
