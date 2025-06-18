const express = require('express');
const { getAllUsers, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Tutte le rotte richiedono autenticazione
router.use(authenticate);

// Rotte per admin
router.get('/', isAdmin, getAllUsers);
router.delete('/:id', isAdmin, deleteUser);

// Rotte per utenti autenticati (admin o stesso utente)
router.get('/:id', getUserById);
router.put('/:id', updateUser);

module.exports = router;
