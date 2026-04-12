const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const validarApiKey = require('../middleware/auth'); // Importamos el guardia

// GET: Libre para que cualquiera vea (o podrías protegerlo también)
router.get('/', pedidosController.getPedidos);

// Rutas PROTEGIDAS (Agregamos el middleware antes del controlador)
router.post('/', validarApiKey, pedidosController.createPedido);
router.put('/:id', validarApiKey, pedidosController.updatePedido);
router.delete('/:id', validarApiKey, pedidosController.deletePedido);

module.exports = router;