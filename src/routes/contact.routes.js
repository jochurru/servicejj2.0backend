const express = require('express');
const router = express.Router();
const validarApiKey = require('../middleware/auth.middleware');
const contactController = require('../controllers/contact.controller');

router.post('/', validarApiKey, contactController.postConsulta);

module.exports = router;
