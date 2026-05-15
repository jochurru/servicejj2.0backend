function parseCreatePedido(body) {
    const { nombre, equipo, modelo, falla, telefono, email, clienteId } = body;

    return {
        nombre: nombre ?? '',
        equipo: equipo ?? '',
        modelo: modelo ?? null,
        falla: falla ?? '',
        telefono: telefono ?? '',
        email: email ? String(email).trim().toLowerCase() : null,
        clienteId: clienteId ?? null
    };
}

module.exports = { parseCreatePedido };
