const ESTADOS = ['pendiente', 'en reparación', 'listo', 'entregado', 'cancelado'];

function buildPedidoPayload({ pedidoId, idCorto, dto, fotosUrls, fechaCreacion }) {
    return {
        pedidoId,
        idCorto,
        nombre: dto.nombre.trim(),
        equipo: dto.equipo.trim(),
        modelo: dto.modelo || 'No provisto',
        falla: dto.falla.trim(),
        telefono: dto.telefono.trim(),
        email: dto.email || 'No provisto',
        clienteId: dto.clienteId && dto.clienteId !== 'null' ? dto.clienteId : null,
        fotos: fotosUrls,
        estado: 'pendiente',
        fechaCreacion,
        notasTecnico: []
    };
}

function buildNotaTecnico(texto, estado = null) {
    const nota = {
        fecha: new Date().toLocaleString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }) + ' hs',
        texto,
    };
    if (estado) {
        nota.estado = estado;
    }
    return nota;
}

module.exports = { ESTADOS, buildPedidoPayload, buildNotaTecnico };
