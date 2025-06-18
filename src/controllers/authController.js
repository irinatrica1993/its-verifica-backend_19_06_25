const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

// Valore di fallback per JWT_SECRET in caso non sia configurato
const JWT_SECRET = process.env.JWT_SECRET || 'la_tua_chiave_segreta_molto_lunga_e_complessa';

// Funzione per gestire gli errori in modo consistente
const handleError = (res, error, message) => {
  console.error(`Errore: ${message}`, error);
  return res.status(500).json({ 
    message, 
    error: process.env.NODE_ENV === 'development' ? error.message : undefined 
  });
};

// Registrazione di un nuovo utente
const register = async (req, res) => {
  try {
    const { email, name, password, role } = req.body;

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
    let userRole = 'user'; // Default è utente normale
    
    // Caso 1: Se è il primo utente nel sistema, assegna ruolo admin
    const isFirstUser = (await prisma.user.count()) === 0;
    if (isFirstUser) {
      userRole = 'admin';
    }
    // Caso 2: Se è richiesto un ruolo admin e la richiesta proviene da un admin esistente
    else if (role === 'admin') {
      // Verifica se la richiesta proviene da un admin
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
      } else if (role === 'admin') {
        // Se è richiesto un ruolo admin ma non c'è token di autenticazione
        return res.status(401).json({ 
          message: 'Autenticazione richiesta per creare un amministratore.' 
        });
      }
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: userRole
      }
    });

    // Genera il token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      message: 'Utente registrato con successo',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
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
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login effettuato con successo',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
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
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
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
