const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const validarApiKey = require('../middleware/auth'); // El guardia de seguridad
const upload = require('../middleware/upload');    // El "portero" de archivos (Multer)

// --- RUTAS PÚBLICAS ---
// GET: Para que el sistema (o vos) pueda listar los pedidos
router.get('/', pedidosController.getPedidos);
// Nueva ruta para vincular pedidos cuando el cliente se loguea
router.post('/reclamar', upload.none(), pedidosController.reclamarPedidos);

// --- RUTAS PROTEGIDAS ---

/** 
 * POST: Crear pedido
 * 1. Validamos la API Key
 * 2. Multer procesa las fotos (máximo 5) y las deja en req.files
 * 3. El controlador las sube a Cloudinary y guarda en Firebase
 */
router.post(
    '/', 
    validarApiKey, 
    upload.array('fotos', 5), // 'fotos' debe coincidir con el append del Front
    pedidosController.createPedido
);

// PUT: Actualizar pedido
router.put('/:id', validarApiKey, pedidosController.updatePedido);

// DELETE: Borrar pedido
router.delete('/:id', validarApiKey, pedidosController.deletePedido);

module.exports = router;