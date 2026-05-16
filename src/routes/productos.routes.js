const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productos.controller');
const verifyAdmin = require('../middleware/verify-admin.middleware');
const upload = require('../middleware/upload.middleware');
const optionalAdmin = verifyAdmin.optionalAdmin;

router.get('/', optionalAdmin, productosController.listProductos);
router.post('/', verifyAdmin, upload.single('imagen'), productosController.createProducto);
router.put('/:id', verifyAdmin, upload.single('imagen'), productosController.updateProducto);
router.delete('/:id', verifyAdmin, productosController.deleteProducto);

module.exports = router;
