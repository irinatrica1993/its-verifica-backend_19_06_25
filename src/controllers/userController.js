const prisma = require('../prisma');
const bcrypt = require('bcryptjs');

// Ottieni tutti gli utenti (solo per admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.json(users);
  } catch (error) {
    console.error('Errore durante il recupero degli utenti:', error);
    res.status(500).json({ message: 'Errore durante il recupero degli utenti', error: error.message });
  }
};

// Ottieni un utente specifico per ID (admin o stesso utente)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verifica che l'utente sia admin o stia cercando il proprio profilo
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ message: 'Non hai i permessi per visualizzare questo utente.' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id },
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
    console.error('Errore durante il recupero dell\'utente:', error);
    res.status(500).json({ message: 'Errore durante il recupero dell\'utente', error: error.message });
  }
};

// Aggiorna un utente (admin o stesso utente)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;
    
    // Verifica che l'utente sia admin o stia aggiornando il proprio profilo
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ message: 'Non hai i permessi per aggiornare questo utente.' });
    }
    
    // Se non è admin, non può cambiare il ruolo
    if (req.user.role !== 'admin' && role) {
      return res.status(403).json({ message: 'Non hai i permessi per cambiare il ruolo.' });
    }
    
    // Prepara i dati da aggiornare
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }
    if (role && req.user.role === 'admin') updateData.role = role;
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.json({
      message: 'Utente aggiornato con successo',
      user: updatedUser
    });
  } catch (error) {
    console.error('Errore durante l\'aggiornamento dell\'utente:', error);
    res.status(500).json({ message: 'Errore durante l\'aggiornamento dell\'utente', error: error.message });
  }
};

// Elimina un utente (solo admin)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Solo gli admin possono eliminare gli utenti
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non hai i permessi per eliminare gli utenti.' });
    }
    
    // Verifica che l'utente esista
    const user = await prisma.user.findUnique({
      where: { id },
      include: { posts: true }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato.' });
    }
    
    // Prima elimina tutti i post associati all'utente
    if (user.posts && user.posts.length > 0) {
      await prisma.post.deleteMany({
        where: { authorId: id }
      });
    }
    
    // Poi elimina l'utente
    await prisma.user.delete({
      where: { id }
    });
    
    res.json({ message: 'Utente eliminato con successo' });
  } catch (error) {
    console.error('Errore durante l\'eliminazione dell\'utente:', error);
    res.status(500).json({ message: 'Errore durante l\'eliminazione dell\'utente', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};
