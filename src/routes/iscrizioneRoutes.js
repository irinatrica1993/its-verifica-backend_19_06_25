const express = require('express');
const router = express.Router();
const iscrizioneController = require('../controllers/iscrizioneController');
const { authenticate, isOrganizzatore: isAdmin } = require('../middleware/authMiddleware');

// Rotte per le iscrizioni dell'utente corrente
router.get('/utente', authenticate, iscrizioneController.getIscrizioniUtente);
router.post('/', authenticate, iscrizioneController.createIscrizione);
router.delete('/:id', authenticate, iscrizioneController.deleteIscrizione);

// Rotte per gli organizzatori
router.get('/evento/:eventoId', authenticate, isAdmin, iscrizioneController.getIscrizioniEvento);
router.put('/:id/checkin', authenticate, isAdmin, iscrizioneController.registraCheckin);

module.exports = router;
