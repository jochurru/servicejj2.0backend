const { generatePedidoId, generateIdCorto, normalizeTicket } = require('../domain/id-generator');
const { NotFoundError, ValidationError } = require('../domain/errors');
const { buildPedidoPayload } = require('../domain/pedido.entity');
const { buildSeguimientoPayload } = require('../domain/seguimiento.entity');
const pedidosRepository = require('../repositories/pedidos.repository');
const seguimientoRepository = require('../repositories/seguimiento.repository');
const { createBatch, commitBatch } = require('../repositories/batch.helper');
const storage = require('../storage');

async function listAll() {
    return pedidosRepository.findAllOrdered();
}

async function findByTicket(idCorto) {
    const ticket = normalizeTicket(idCorto);
    const pedido = await pedidosRepository.findByIdCorto(ticket);

    if (!pedido) {
        throw new NotFoundError('Pedido no encontrado');
    }

    return pedido;
}

async function create(dto, files) {
    const fotosUrls = await storage.uploadMany(files);
    const fechaCreacion = new Date();
    const pedidoId = generatePedidoId(fechaCreacion);
    const idCorto = generateIdCorto();

    const pedido = buildPedidoPayload({
        pedidoId,
        idCorto,
        dto,
        fotosUrls,
        fechaCreacion
    });
    const seguimiento = buildSeguimientoPayload({ idCorto, dto, fecha: fechaCreacion });

    const batch = createBatch();
    pedidosRepository.setInBatch(batch, pedidoId, pedido);
    seguimientoRepository.setInBatch(batch, pedidoId, seguimiento);
    await commitBatch(batch);

    return {
        id: pedidoId,
        idCorto,
        mensaje: 'Pedido registrado y sincronizado con éxito.'
    };
}

async function update(id, dto) {
    const batch = createBatch();
    let hasWrites = false;

    if (dto.nuevaNota) {
        pedidosRepository.updateInBatch(
            batch,
            id,
            pedidosRepository.buildUpdateWithNota(dto.nuevaNota, dto.estado)
        );
        hasWrites = true;
    } else if (dto.estado) {
        pedidosRepository.updateInBatch(batch, id, { estado: dto.estado });
        hasWrites = true;
    }

    const actualizado = new Date();
    if (dto.nuevaNota) {
        seguimientoRepository.updateWithNotaInBatch(
            batch,
            id,
            dto.nuevaNota,
            dto.estado,
            actualizado
        );
        hasWrites = true;
    } else if (dto.estado) {
        seguimientoRepository.updateEstadoInBatch(batch, id, dto.estado, actualizado);
        hasWrites = true;
    }

    if (!hasWrites) {
        throw new ValidationError('No hay cambios para guardar.');
    }

    await commitBatch(batch);

    return { mensaje: 'Pedido y seguimiento actualizados.' };
}

async function remove(id) {
    const batch = createBatch();
    pedidosRepository.deleteInBatch(batch, id);
    seguimientoRepository.deleteInBatch(batch, id);
    await commitBatch(batch);

    return { mensaje: 'Pedido eliminado de todas las bases.' };
}

async function reclamar(dto) {
    const docs = await pedidosRepository.findByEmail(dto.email);

    if (docs.length === 0) {
        return { success: false, mensaje: 'No hay pedidos con ese mail.' };
    }

    const count = await pedidosRepository.linkClienteIdToDocs(docs, dto.clienteId);

    return {
        success: true,
        message: `Se vincularon ${count} pedidos.`
    };
}

module.exports = { listAll, findByTicket, create, update, remove, reclamar };
