const { db } = require('../config/firebase');
const cloudinary = require('../config/cloudinary');

// 1. OBTENER TODOS LOS PEDIDOS
const getPedidos = async (req, res) => {
    try {
        const snapshot = await db.collection('pedidos')
                                .orderBy('pedidoId', 'desc') 
                                .get();
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(data);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 2. CREATE - Crear un nuevo pedido con Imágenes en Cloudinary (ACTUALIZADO)
const createPedido = async (req, res) => {
    try {
        // AGREGAMOS 'clienteId' a la desestructuración
        const { nombre, equipo, modelo, falla, telefono, email, clienteId } = req.body;
        const archivos = req.files; 

        // Validación de campos obligatorios
        if (!nombre || !equipo || !falla || !telefono) {
            return res.status(400).json({ 
                success: false, 
                mensaje: "Error: Nombre, Equipo, Falla y WhatsApp son obligatorios." 
            });
        }

        // --- LÓGICA DE CLOUDINARY ---
        let fotosUrls = [];
        if (archivos && archivos.length > 0) {
            const uploadPromises = archivos.map(file => 
                cloudinary.uploader.upload(file.path, {
                    folder: 'service-jj-pedidos',
                    resource_type: 'auto'
                })
            );

            const results = await Promise.all(uploadPromises);
            fotosUrls = results.map(result => result.secure_url);
        }

        // Generación de ID Relacional
        const ahora = new Date();
        const idRelacional = ahora.getFullYear().toString() +
                            (ahora.getMonth() + 1).toString().padStart(2, '0') +
                            ahora.getDate().toString().padStart(2, '0') +
                            ahora.getHours().toString().padStart(2, '0') +
                            ahora.getMinutes().toString().padStart(2, '0') +
                            ahora.getSeconds().toString().padStart(2, '0');

        const nuevoPedido = {
            pedidoId: parseInt(idRelacional),
            nombre: nombre.trim().substring(0, 50),
            equipo: equipo.trim().substring(0, 50),
            modelo: modelo ? modelo.trim().substring(0, 50) : "No provisto",
            falla: falla.trim().substring(0, 500),
            telefono: telefono.trim(),
            email: email ? email.trim() : "No provisto",
            clienteId: clienteId || null, // <--- CLAVE: Guardamos el ID que viene del Front
            fotos: fotosUrls,
            estado: 'pendiente',
            fechaCreacion: ahora
        };

        // Guardamos en Firestore
        await db.collection('pedidos').doc(idRelacional).set(nuevoPedido);

        res.status(201).json({ 
            success: true, 
            id: idRelacional,
            mensaje: "Pedido registrado con éxito en la nube." 
        });

    } catch (error) {
        console.error("Error en createPedido:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 3. UPDATE
const updatePedido = async (req, res) => {
    try {
        const { id } = req.params;
        const nuevosDatos = req.body;
        const doc = await db.collection('pedidos').doc(id).get();
        if (!doc.exists) return res.status(404).json({ success: false, mensaje: "El pedido no existe." });
        
        await db.collection('pedidos').doc(id).update(nuevosDatos);
        res.json({ success: true, mensaje: `Pedido ${id} actualizado.` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 4. DELETE
const deletePedido = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await db.collection('pedidos').doc(id).get();
        if (!doc.exists) return res.status(404).json({ success: false, mensaje: "El pedido no existe." });
        
        await db.collection('pedidos').doc(id).delete();
        res.json({ success: true, mensaje: `Pedido ${id} eliminado.` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { getPedidos, createPedido, updatePedido, deletePedido };