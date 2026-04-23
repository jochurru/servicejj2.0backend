const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const validarApiKey = require('../middleware/auth'); 
const upload = require('../middleware/upload'); 

// --- RUTAS PÚBLICAS ---

// 🚀 CAMBIO CLAVE: Usamos getSeguimientoPublico (como está en tu controlador)
router.get('/seguimiento/:idCorto', pedidosController.getSeguimientoPublico);

// Vincular pedidos
router.post('/reclamar', upload.none(), pedidosController.reclamarPedidos);

// --- RUTAS PROTEGIDAS ---

router.get('/', validarApiKey, pedidosController.getPedidos);

router.post(
    '/', 
    validarApiKey, 
    upload.array('fotos', 5), 
    pedidosController.createPedido
);

router.put('/:id', validarApiKey, pedidosController.updatePedido);
router.delete('/:id', validarApiKey, pedidosController.deletePedido);

module.exports = router;