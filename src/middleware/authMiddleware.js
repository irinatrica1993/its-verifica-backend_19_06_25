const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

// Valore di fallback per JWT_SECRET in caso non sia configurato
const JWT_SECRET = process.env.JWT_SECRET || 'its-verifica-default-jwt-secret-key-2025';

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
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Errore di autenticazione:', error);
    return res.status(401).json({ message: 'Token non valido o scaduto.' });
  }
};

// Middleware per verificare il ruolo di admin
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accesso negato. Richiesti privilegi di amministratore.' });
  }
  next();
};

module.exports = { authenticate, isAdmin };
