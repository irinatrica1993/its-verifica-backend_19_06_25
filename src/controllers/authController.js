const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

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

    // Crea un nuovo utente
    // Se l'utente che sta creando è il primo, assegna il ruolo di admin
    // altrimenti usa il ruolo fornito o 'user' come default
    const isFirstUser = (await prisma.user.count()) === 0;
    const userRole = isFirstUser ? 'admin' : (role || 'user');

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
    console.error('Errore durante la registrazione:', error);
    res.status(500).json({ message: 'Errore durante la registrazione', error: error.message });
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
    console.error('Errore durante il login:', error);
    res.status(500).json({ message: 'Errore durante il login', error: error.message });
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
    console.error('Errore durante il recupero del profilo:', error);
    res.status(500).json({ message: 'Errore durante il recupero del profilo', error: error.message });
  }
};

module.exports = { register, login, getProfile };
