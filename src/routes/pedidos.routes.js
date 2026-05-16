const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidos.controller');
const validarApiKey = require('../middleware/auth.middleware');
const verifyAdmin = require('../middleware/verify-admin.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/seguimiento/:idCorto', pedidosController.getSeguimientoPublico);

router.post('/reclamar', upload.none(), pedidosController.reclamarPedidos);

router.post('/', validarApiKey, upload.array('fotos', 5), pedidosController.createPedido);

router.get('/ticket/:idCorto', verifyAdmin, pedidosController.getPedidoByTicket);

router.get('/', verifyAdmin, pedidosController.getPedidos);

router.put('/:id', verifyAdmin, pedidosController.updatePedido);

router.delete('/:id', verifyAdmin, pedidosController.deletePedido);

module.exports = router;
