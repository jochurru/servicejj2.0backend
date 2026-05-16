const productosService = require('../services/productos.service');

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const listProductos = asyncHandler(async (req, res) => {
    const productos = req.isAdmin
        ? await productosService.listAdmin()
        : await productosService.listPublic();
    res.json({ success: true, productos });
});

const createProducto = asyncHandler(async (req, res) => {
    const dto = productosService.parseProductoBody(req.body);
    const producto = await productosService.create(dto, req.file);
    res.status(201).json({ success: true, producto });
});

const updateProducto = asyncHandler(async (req, res) => {
    const dto = productosService.parseProductoBody(req.body);
    const producto = await productosService.update(req.params.id, dto, req.file);
    res.json({ success: true, producto });
});

const deleteProducto = asyncHandler(async (req, res) => {
    const result = await productosService.remove(req.params.id);
    res.json({ success: true, ...result });
});

module.exports = {
    listProductos,
    createProducto,
    updateProducto,
    deleteProducto,
};
