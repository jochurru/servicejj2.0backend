function buildSeguimientoPayload({ idCorto, dto, fecha }) {
    return {
        idCorto,
        equipo: `${dto.equipo} ${dto.modelo || ''}`.trim(),
        falla: dto.falla.trim(),
        estado: 'pendiente',
        actualizado: fecha
    };
}

module.exports = { buildSeguimientoPayload };
