const { db } = require('../config/firebase');

// 1. OBTENER TODOS LOS PEDIDOS
const getPedidos = async (req, res) => {
try {
// Ordenamos por 'pedidoId' de forma descendente (el más nuevo primero)
const snapshot = await db.collection('pedidos')
                        .orderBy('pedidoId', 'desc') 
                        .get();
                        
const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
res.json(data);
} catch (error) {
res.status(500).json({ success: false, error: error.message });
}
};

// 2. CREATE - Crear un nuevo pedido con ID Relacional
const createPedido = async (req, res) => {
try {
const { nombre, equipo, modelo, falla, telefono, email } = req.body;

// Validación de campos obligatorios
if (!nombre || !equipo || !falla) {
    return res.status(400).json({ 
    success: false, 
    mensaje: "Error: Nombre, Equipo y Falla son obligatorios." 
    });
}

// Validación de contacto (Negocio)
if (!telefono && !email) {
    return res.status(400).json({ 
    success: false, 
    mensaje: "Debe proporcionar al menos un medio de contacto (Teléfono o Email)." 
    });
}

// Generación de ID Relacional (AAAAMMDDHHMMSS)
const ahora = new Date();
const idRelacional = ahora.getFullYear().toString() +
                        (ahora.getMonth() + 1).toString().padStart(2, '0') +
                        ahora.getDate().toString().padStart(2, '0') +
                        ahora.getHours().toString().padStart(2, '0') +
                        ahora.getMinutes().toString().padStart(2, '0') +
                        ahora.getSeconds().toString().padStart(2, '0');

const nuevoPedido = {
    pedidoId: parseInt(idRelacional), // ID para futuras relaciones SQL
    nombre: nombre.trim().substring(0, 50), // Limitar a 50 caracteres
    equipo: equipo.trim().substring(0, 50), // Limitar a 50 caracteres
    modelo: modelo.trim().substring(0, 50) || "No provisto", // Limitar a 50 caracteres
    falla: falla.trim().substring(0, 200), // Limitar a 200 caracteres
    telefono: telefono || "No provisto",
    email: email || "No provisto",
    estado: 'pendiente',
    fechaCreacion: ahora
};

// Guardamos usando el ID relacional como nombre del documento
await db.collection('pedidos').doc(idRelacional).set(nuevoPedido);

res.status(201).json({ 
    success: true, 
    id: idRelacional,
    mensaje: "Pedido registrado con éxito." 
});

} catch (error) {
res.status(500).json({ success: false, error: error.message });
}
};

// 3. UPDATE - Modificar un pedido existente
const updatePedido = async (req, res) => {
try {
const { id } = req.params;
const nuevosDatos = req.body;

// Verificamos si existe antes de actualizar
const doc = await db.collection('pedidos').doc(id).get();
if (!doc.exists) {
    return res.status(404).json({ 
    success: false, 
    mensaje: "Error: El pedido no existe." 
    });
}

// Evitamos que borren el nombre si mandan el campo vacío
if (nuevosDatos.hasOwnProperty('nombre') && !nuevosDatos.nombre) {
    return res.status(400).json({ 
    success: false, 
    mensaje: "Error: El nombre no puede quedar vacío." 
    });
}

await db.collection('pedidos').doc(id).update(nuevosDatos);

res.json({ 
    success: true, 
    mensaje: `Pedido ${id} actualizado correctamente.` 
});

} catch (error) {
res.status(500).json({ success: false, error: error.message });
}
};

// 4. DELETE - Borrar un pedido
const deletePedido = async (req, res) => {
try {
const { id } = req.params;

const doc = await db.collection('pedidos').doc(id).get();
if (!doc.exists) {
    return res.status(404).json({ 
    success: false, 
    mensaje: "Error: El pedido no existe." 
    });
}

await db.collection('pedidos').doc(id).delete();
res.json({ success: true, mensaje: `Pedido ${id} eliminado.` });

} catch (error) {
res.status(500).json({ success: false, error: error.message });
}
};

module.exports = { getPedidos, createPedido, updatePedido, deletePedido };