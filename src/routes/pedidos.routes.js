const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidos.controller');
const validarApiKey = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/seguimiento/:idCorto', pedidosController.getSeguimientoPublico);

router.post('/reclamar', upload.none(), pedidosController.reclamarPedidos);

router.get('/ticket/:idCorto', validarApiKey, pedidosController.getPedidoByTicket);

router.get('/', validarApiKey, pedidosController.getPedidos);

router.post('/', validarApiKey, upload.array('fotos', 5), pedidosController.createPedido);

router.put('/:id', validarApiKey, pedidosController.updatePedido);

router.delete('/:id', validarApiKey, pedidosController.deletePedido);

module.exports = router;
