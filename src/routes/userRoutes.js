const express = require('express');
const { getAllUsers, getUserById, updateUser, deleteUser, deleteAllUsers, getUserCount } = require('../controllers/userController');
const { authenticate, isOrganizzatore } = require('../middleware/authMiddleware');

const router = express.Router();
//cors
const cors = require('cors');

// Rotta temporanea per sviluppo - RIMUOVERE IN PRODUZIONE
// Questa rotta è posizionata prima del middleware di autenticazione per permettere il reset senza token
router.delete('/dev/reset-all', deleteAllUsers);

// Tutte le altre rotte richiedono autenticazione
router.use(authenticate);

// Rotte per organizzatori
router.get('/', isOrganizzatore, getAllUsers);
router.get('/count', isOrganizzatore, getUserCount);
router.delete('/:id', isOrganizzatore, deleteUser);

// Rotte per utenti autenticati (admin o stesso utente)
router.get('/:id', getUserById);
router.put('/:id', updateUser);

module.exports = router;
