const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

// Valore di fallback per JWT_SECRET in caso non sia configurato
const JWT_SECRET = process.env.JWT_SECRET || 'la_tua_chiave_segreta_molto_lunga_e_complessa';

// Middleware per verificare il token JWT
const authenticate = async (req, res, next) => {
  try {
    // Ottieni il token dall'header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Accesso non autorizzato. Token mancante.' });
    }

    // Estrai il token
    const token = authHeader.split(' ')[1];

    // Verifica il token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Trova l'utente nel database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ message: 'Utente non trovato.' });
    }

    // Aggiungi l'utente alla richiesta
    req.user = {
      userId: user.id,
      email: user.email,
      nome: user.nome,
      cognome: user.cognome,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Errore di autenticazione:', error);
    return res.status(401).json({ message: 'Token non valido o scaduto.' });
  }
};

// Middleware per verificare il ruolo di admin
const isOrganizzatore = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accesso negato. Richiesti privilegi di amministratore.' });
  }
  next();
};

// Middleware per verificare che l'utente sia il proprietario della risorsa o un admin
const isOwnerOrOrganizzatore = (resourceUserId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Accesso non autorizzato.' });
    }
    
    if (req.user.role === 'admin' || req.user.userId === resourceUserId) {
      next();
    } else {
      return res.status(403).json({ message: 'Accesso negato. Non sei autorizzato ad accedere a questa risorsa.' });
    }
  };
};

module.exports = { authenticate, isOrganizzatore, isOwnerOrOrganizzatore };
