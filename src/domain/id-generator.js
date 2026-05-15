function generatePedidoId(date = new Date()) {
    return (
        date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0') +
        date.getHours().toString().padStart(2, '0') +
        date.getMinutes().toString().padStart(2, '0') +
        date.getSeconds().toString().padStart(2, '0')
    );
}

function generateIdCorto() {
    return `SJ-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

function normalizeTicket(idCorto) {
    let ticket = idCorto.trim().toUpperCase();

    if (ticket.startsWith('SJ-SJ-')) {
        ticket = ticket.replace('SJ-SJ-', 'SJ-');
    } else if (!ticket.startsWith('SJ-')) {
        ticket = `SJ-${ticket}`;
    }

    return ticket;
}

module.exports = { generatePedidoId, generateIdCorto, normalizeTicket };
