const { normalizeTicket } = require('../domain/id-generator');
const { NotFoundError } = require('../domain/errors');
const seguimientoRepository = require('../repositories/seguimiento.repository');
const qrService = require('./qr.service');

async function findByTicket(idCorto) {
    const ticket = normalizeTicket(idCorto);
    const row = await seguimientoRepository.findByIdCorto(ticket);

    if (!row) {
        throw new NotFoundError('Ticket no encontrado');
    }

    const docId = row.id;
    const { id: _omitId, ...data } = row;

    if (!data.qrContenido) {
        data.qrContenido = qrService.buildTrackingUrl(ticket);
    }

    if (!data.qrUrl) {
        try {
            const { qrUrl, qrContenido } = await qrService.generateAndUpload(ticket);
            data.qrUrl = qrUrl;
            data.qrContenido = qrContenido;
            await seguimientoRepository.updateQrUrl(docId, qrUrl, qrContenido);
        } catch (err) {
            console.error('No se pudo generar QR de seguimiento:', err.message);
        }
    }

    return { ...data, idCorto: ticket };
}
module.exports = { findByTicket };
