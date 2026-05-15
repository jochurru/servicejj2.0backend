function parseUpdatePedido(body) {
    const { nuevaNota, estado, ...rest } = body;

    return {
        nuevaNota: nuevaNota ?? null,
        estado: estado ?? null,
        rest
    };
}

module.exports = { parseUpdatePedido };
