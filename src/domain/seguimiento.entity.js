function buildSeguimientoPayload({ idCorto, dto, fecha, qrUrl, qrContenido }) {
    return {
        idCorto,
        qrUrl: qrUrl || null,
        qrContenido: qrContenido || null,
        equipo: `${dto.equipo} ${dto.modelo || ''}`.trim(),
        falla: dto.falla.trim(),
        estado: 'pendiente',
        actualizado: fecha,
    };
}
module.exports = { buildSeguimientoPayload };
