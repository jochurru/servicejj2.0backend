const pedidosService = require('../services/pedidos.service');
const seguimientoService = require('../services/seguimiento.service');
const { parseCreatePedido } = require('../dto/create-pedido.dto');
const { parseUpdatePedido } = require('../dto/update-pedido.dto');
const { parseReclamarPedidos } = require('../dto/reclamar-pedidos.dto');
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const getPedidos = asyncHandler(async (req, res) => {
    const data = await pedidosService.listAll();
    res.json(data);
});

const getPedidoByTicket = asyncHandler(async (req, res) => {
    const data = await pedidosService.findByTicket(req.params.idCorto);
    res.json({ success: true, pedido: data });
});

const createPedido = asyncHandler(async (req, res) => {
    const dto = parseCreatePedido(req.body);
    const result = await pedidosService.create(dto, req.files);

    res.status(201).json({
        success: true,
        id: result.id,
        idCorto: result.idCorto,
        mensaje: result.mensaje
    });
});

const updatePedido = asyncHandler(async (req, res) => {
    const dto = parseUpdatePedido(req.body);
    const result = await pedidosService.update(req.params.id, dto);

    res.json({ success: true, mensaje: result.mensaje });
});

const deletePedido = asyncHandler(async (req, res) => {
    const result = await pedidosService.remove(req.params.id);

    res.json({ success: true, mensaje: result.mensaje });
});

const reclamarPedidos = asyncHandler(async (req, res) => {
    const dto = parseReclamarPedidos(req.body);
    const result = await pedidosService.reclamar(dto);

    res.json(result);
});

const getSeguimientoPublico = asyncHandler(async (req, res) => {
    const data = await seguimientoService.findByTicket(req.params.idCorto);

    res.json({ success: true, ...data });
});

module.exports = {
    getPedidos,
    getPedidoByTicket,
    createPedido,
    updatePedido,
    deletePedido,
    reclamarPedidos,
    getSeguimientoPublico
};
