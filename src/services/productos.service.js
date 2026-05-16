const { NotFoundError, ValidationError } = require('../domain/errors');
const productosRepository = require('../repositories/productos.repository');
const storage = require('../storage');

function parseProductoBody(body) {
    const nombre = body.nombre?.trim();
    if (!nombre) throw new ValidationError('El nombre es obligatorio');

    const precio = Number(body.precio);
    if (Number.isNaN(precio) || precio < 0) {
        throw new ValidationError('Precio inválido');
    }

    const stock = body.stock !== undefined && body.stock !== ''
        ? Number(body.stock)
        : 0;

    return {
        nombre,
        descripcion: body.descripcion?.trim() || '',
        precio,
        stock: Number.isNaN(stock) ? 0 : stock,
        categoria: body.categoria?.trim() || 'Equipos',
        activo: body.activo === 'false' || body.activo === false ? false : true,
        orden: body.orden ? Number(body.orden) : Date.now(),
    };
}

async function listPublic() {
    return productosRepository.findAllActive();
}

async function listAdmin() {
    return productosRepository.findAll();
}

async function create(dto, file) {
    let imagen = dto.imagenUrl || null;
    if (file) {
        const urls = await storage.uploadMany([file], 'service-jj-productos');
        imagen = urls[0];
    }
    if (!imagen) throw new ValidationError('La imagen del producto es obligatoria');

    return productosRepository.create({ ...dto, imagen });
}

async function update(id, dto, file) {
    const existing = await productosRepository.findById(id);
    if (!existing) throw new NotFoundError('Producto no encontrado');

    let imagen = existing.imagen;
    let previousImagen = null;
    if (file) {
        const urls = await storage.uploadMany([file], 'service-jj-productos');
        previousImagen = existing.imagen;
        imagen = urls[0];
    }

    const updated = await productosRepository.update(id, { ...dto, imagen });

    if (previousImagen && previousImagen !== imagen) {
        await storage.destroyBySecureUrl(previousImagen);
    }

    return updated;
}

async function remove(id) {
    const existing = await productosRepository.findById(id);
    if (!existing) throw new NotFoundError('Producto no encontrado');
    await productosRepository.remove(id);
    if (existing.imagen) {
        await storage.destroyBySecureUrl(existing.imagen);
    }
    return { mensaje: 'Producto eliminado correctamente' };
}

module.exports = {
    listPublic,
    listAdmin,
    create,
    update,
    remove,
    parseProductoBody,
};
