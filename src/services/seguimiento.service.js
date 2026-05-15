const { normalizeTicket } = require('../domain/id-generator');
const { NotFoundError } = require('../domain/errors');
const seguimientoRepository = require('../repositories/seguimiento.repository');

async function findByTicket(idCorto) {
    const ticket = normalizeTicket(idCorto);
    const data = await seguimientoRepository.findByIdCorto(ticket);

    if (!data) {
        throw new NotFoundError('Ticket no encontrado');
    }

    return data;
}

module.exports = { findByTicket };
