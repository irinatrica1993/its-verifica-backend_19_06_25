const express = require('express');
const router = express.Router();
const eventoController = require('../controllers/eventoController');
const { authenticate, isOrganizzatore } = require('../middleware/authMiddleware');

// Rotte pubbliche (con autenticazione ma senza controllo ruolo)
router.get('/', authenticate, eventoController.getAllEventi);
router.get('/:id', authenticate, eventoController.getEventoById);

// Rotte protette (solo organizzatori)
router.post('/', authenticate, isOrganizzatore, eventoController.createEvento);
router.put('/:id', authenticate, isOrganizzatore, eventoController.updateEvento);
router.delete('/:id', authenticate, isOrganizzatore, eventoController.deleteEvento);
router.get('/statistiche/eventi-passati', authenticate, isOrganizzatore, eventoController.getStatisticheEventi);

module.exports = router;
