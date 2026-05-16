const { normalizeTicket } = require('../domain/id-generator');
const { NotFoundError, ValidationError } = require('../domain/errors');
const { buildPedidoPayload } = require('../domain/pedido.entity');
const { buildSeguimientoPayload } = require('../domain/seguimiento.entity');
const pedidosRepository = require('../repositories/pedidos.repository');
const seguimientoRepository = require('../repositories/seguimiento.repository');
const { createBatch, commitBatch } = require('../repositories/batch.helper');
const qrService = require('./qr.service');

async function ensureQrUrl(pedido) {
    if (!pedido || pedido.qrUrl) {
        return pedido;
    }

    const ticket = normalizeTicket(pedido.idCorto || pedido.id);
    const { qrUrl, qrContenido } = await qrService.generateAndUpload(ticket);

    await pedidosRepository.updateQrUrl(pedido.id, qrUrl, qrContenido);
    await seguimientoRepository.updateQrUrl(pedido.id, qrUrl, qrContenido).catch(() => {});

    return { ...pedido, qrUrl, qrContenido, idCorto: ticket };
}

async function listAll() {
    const pedidos = await pedidosRepository.findAllOrdered();
    const result = [];
    const batchSize = 2;
    for (let i = 0; i < pedidos.length; i += batchSize) {
        const slice = pedidos.slice(i, i + batchSize);
        const done = await Promise.all(slice.map((p) => ensureQrUrl(p)));
        result.push(...done);
    }
    return result;
}

async function findByTicket(idCorto) {
    const ticket = normalizeTicket(idCorto);
    const pedido = await pedidosRepository.findByIdCorto(ticket);

    if (!pedido) {
        throw new NotFoundError('Pedido no encontrado');
    }

    return ensureQrUrl(pedido);
}

/**
 * Persiste pedido + seguimiento en Firestore. Llamar solo después de que el QR esté en Cloudinary.
 */
async function persistNewPedido({
    pedidoId,
    idCorto,
    dto,
    fotosUrls,
    fechaCreacion,
    qrUrl,
    qrContenido,
}) {
    const pedido = buildPedidoPayload({
        pedidoId,
        idCorto,
        dto,
        fotosUrls,
        fechaCreacion,
        qrUrl,
        qrContenido,
    });
    const seguimiento = buildSeguimientoPayload({
        idCorto,
        dto,
        fecha: fechaCreacion,
        qrUrl,
        qrContenido,
    });

    const batch = createBatch();
    pedidosRepository.setInBatch(batch, pedidoId, pedido);
    seguimientoRepository.setInBatch(batch, pedidoId, seguimiento);
    await commitBatch(batch);

    return {
        id: pedidoId,
        idCorto,
        qrUrl,
        qrContenido,
        mensaje: 'Pedido registrado y sincronizado con éxito.',
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
        message: `Se vincularon ${count} pedidos.`,
    };
}

module.exports = {
    listAll,
    findByTicket,
    persistNewPedido,
    update,
    remove,
    reclamar,
    ensureQrUrl,
};
