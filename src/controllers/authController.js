const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = require('../prisma');
const fs = require('fs');
const path = require('path');

// Chiave segreta per JWT
const JWT_SECRET = process.env.JWT_SECRET || 'chiave-segreta-di-sviluppo';

// Funzione per scrivere i log in un file
const logToFile = (message, data) => {
  const logDir = path.join(__dirname, '../../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, 'auth-errors.log');
  const timestamp = new Date().toISOString();
  const logEntry = `\n[${timestamp}] ${message}\n${JSON.stringify(data, null, 2)}\n-----------------------------------`;
  
  fs.appendFileSync(logFile, logEntry);
  console.log(`Log scritto in ${logFile}`);
};

// Funzione per gestire gli errori in modo centralizzato
const handleError = (res, error, message) => {
  console.error(`Errore: ${message}`, error);
  console.error('Stack trace:', error.stack);
  
  // Scrivi l'errore in un file di log
  logToFile(message, {
    error: error.message,
    stack: error.stack,
    details: JSON.stringify(error, Object.getOwnPropertyNames(error))
  });
  
  // In ambiente di sviluppo, restituisci dettagli completi dell'errore
  return res.status(500).json({ 
    message, 
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};

// Registrazione di un nuovo utente
const register = async (req, res) => {
  try {
    console.log('Inizio registrazione utente:', { ...req.body, password: '***' });
    const { email, nome, cognome, password, role } = req.body;
    console.log('Ambiente:', process.env.NODE_ENV || 'development');

    // Validazione dei dati
    if (!email || !nome || !cognome || !password) {
      return res.status(400).json({ message: 'Tutti i campi sono obbligatori.' });
    }

    // Verifica se l'utente esiste già
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'L\'utente con questa email esiste già.' });
    }

    // Hash della password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Determina il ruolo dell'utente
    // Nel database MongoDB il ruolo è 'user' per dipendenti e 'admin' per organizzatori/amministratori
    let userRole = 'user'; // Default è user (dipendente)
    let mappedRole = role; // Creiamo una copia del ruolo originale
    
    // Se è richiesto il ruolo amministratore o organizzatore, lo mappiamo a 'admin'
    if (role === 'amministratore' || role === 'organizzatore') {
      console.log('Richiesto ruolo privilegiato:', role);
      mappedRole = 'admin'; // Valore nel DB per organizzatori/amministratori
    }
    
    // Caso 1: Se è il primo utente nel sistema, assegna ruolo admin
    const userCount = await prisma.user.count();
    console.log('Conteggio utenti nel sistema:', userCount);
    const isFirstUser = userCount === 0;
    if (isFirstUser) {
      console.log('Primo utente nel sistema, assegnando ruolo admin');
      userRole = 'admin';
    }
    // Caso 2: Se è richiesto un ruolo privilegiato e la richiesta proviene da un admin esistente
    else if (mappedRole === 'admin') {
      // Verifica se la richiesta proviene da un organizzatore
      // Controlla l'header di autorizzazione
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, JWT_SECRET);
          
          // Verifica se l'utente che fa la richiesta è un admin
          if (decoded.role !== 'admin') {
            return res.status(403).json({ 
              message: 'Solo gli amministratori possono creare altri amministratori.' 
            });
          }
          
          // Se è un admin, permetti di creare un altro admin
          userRole = 'admin';
        } catch (err) {
          return res.status(401).json({ message: 'Token non valido o scaduto.' });
        }
      } else {
        // Se è richiesto un ruolo organizzatore ma non c'è token di autenticazione
        return res.status(401).json({ 
          message: 'Autenticazione richiesta per creare un organizzatore.' 
        });
      }
    }

    // Aggiungo un log per vedere quale ruolo verrà assegnato
    console.log('Creazione utente con ruolo:', mappedRole === 'admin' ? mappedRole : userRole);
    
    let user;
    try {
      // Prova a creare l'utente e cattura eventuali errori specifici
      user = await prisma.user.create({
        data: {
          email,
          nome,
          cognome,
          password: hashedPassword,
          // Usiamo il ruolo 'admin' se specificato, altrimenti il default userRole ('user')
          role: mappedRole === 'admin' ? mappedRole : userRole
        }
      });
      
      // Log dell'utente creato
      console.log('Utente creato con successo:', { id: user.id, email: user.email, role: user.role });
    } catch (createError) {
      console.error('Errore durante la creazione dell\'utente:', createError);
      console.error('Dettagli errore:', JSON.stringify(createError, Object.getOwnPropertyNames(createError)));
      return handleError(res, createError, 'Errore specifico durante la creazione dell\'utente');
    }

    // Genera il token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      message: 'Utente registrato con successo',
      token,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome || 'N/A',
        cognome: user.cognome || 'N/A',
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    return handleError(res, error, 'Errore durante la registrazione');
  }
};

// Login di un utente esistente
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validazione dei dati
    if (!email || !password) {
      return res.status(400).json({ message: 'Email e password sono obbligatori.' });
    }

    // Trova l'utente nel database
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ message: 'Credenziali non valide.' });
    }

    // Verifica la password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Credenziali non valide.' });
    }

    // Genera il token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login effettuato con successo',
      token,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome || 'N/A',
        cognome: user.cognome || 'N/A',
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    return handleError(res, error, 'Errore durante il login');
  }
};

// Ottieni il profilo dell'utente corrente
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        nome: true,
        cognome: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato.' });
    }

    res.json(user);
  } catch (error) {
    return handleError(res, error, 'Errore durante il recupero del profilo');
  }
};

module.exports = { register, login, getProfile };
