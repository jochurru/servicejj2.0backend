function parseReclamarPedidos(body) {
    return {
        email: (body.email ?? '').trim().toLowerCase(),
        clienteId: body.clienteId ?? null
    };
}

module.exports = { parseReclamarPedidos };
