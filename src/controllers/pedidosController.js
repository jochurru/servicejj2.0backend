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
        const { nombre, equipo, modelo, falla, telefono, email, clienteId } = req.body;
        const archivos = req.files; 

        // 1. Validación (Sanitización básica)
        if (!nombre || !equipo || !falla || !telefono) {
            return res.status(400).json({ success: false, mensaje: "Faltan campos obligatorios." });
        }

        // 2. Lógica de Cloudinary (Ya la tenías perfecta)
        let fotosUrls = [];
        if (archivos && archivos.length > 0) {
            const uploadPromises = archivos.map(file => 
                cloudinary.uploader.upload(file.path, { folder: 'service-jj-pedidos' })
            );
            const results = await Promise.all(uploadPromises);
            fotosUrls = results.map(result => result.secure_url);
        }

        // 3. Generación de IDs
        const ahora = new Date();
        const idRelacional = ahora.getFullYear().toString() + (ahora.getMonth() + 1).toString().padStart(2, '0') + ahora.getDate().toString().padStart(2, '0') + ahora.getHours().toString().padStart(2, '0') + ahora.getMinutes().toString().padStart(2, '0') + ahora.getSeconds().toString().padStart(2, '0');
        
        // El ID Corto para el humano [cite: 617]
        const idCorto = `SJ-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        // --- 🚀 INICIO DE DOBLE ESCRITURA ATÓMICA --- 
        const batch = db.batch();

        // Referencia 1: El Búnker (Privado)
        const refPrivada = db.collection('pedidos').doc(idRelacional);
        batch.set(refPrivada, {
            pedidoId: parseInt(idRelacional),
            idCorto,
            nombre: nombre.trim(),
            equipo: equipo.trim(),
            modelo: modelo || "No provisto",
            falla: falla.trim(),
            telefono: telefono.trim(),
            email: email || "No provisto",
            clienteId: (clienteId && clienteId !== "null") ? clienteId : null,
            fotos: fotosUrls,
            estado: 'pendiente',
            fechaCreacion: ahora
        });

        // Referencia 2: La Vidriera (Pública para el QR) [cite: 235]
        const refPublica = db.collection('seguimiento').doc(idRelacional);
        batch.set(refPublica, {
            idCorto,
            equipo: `${equipo} ${modelo || ""}`.trim(),
            falla: falla.trim(),
            estado: 'pendiente',
            actualizado: ahora
            // No mandamos teléfono ni nombre por seguridad [cite: 206]
        });

        await batch.commit(); // Se guardan ambos o ninguno [cite: 302]
        // --- FIN DE DOBLE ESCRITURA ---

        res.status(201).json({ 
            success: true, 
            id: idRelacional,
            ticket: idCorto,
            mensaje: "Pedido registrado y sincronizado en la nube Google." 
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
// 5. RECLAMAR PEDIDOS (Vinculación diferida por Email)
const reclamarPedidos = async (req, res) => {
    try {
        const emailRecibido = req.body.email.trim().toLowerCase();
        
        const clienteId = req.body.clienteId || req.body.clienteId || null; 


        const snapshot = await db.collection('pedidos')
                                .where('email', '==', emailRecibido)
                                .get();

        if (snapshot.empty) {
            return res.json({ 
                success: false, 
                mensaje: `No existe ningún pedido registrado con el mail: ${emailRecibido}` 
            });
        }

        const batch = db.batch();
        let vinculados = 0;

        snapshot.docs.forEach(doc => {
            const docRef = doc.ref;


            batch.set(docRef, { 
                clienteId: clienteId 
            }, { merge: true });

            vinculados++;
        });

        await batch.commit();
        res.json({ success: true, mensaje: `¡Éxito! Se vincularon ${vinculados} pedido(s).` });

    } catch (error) {
        // Este es el error que te saltó recién
        res.status(500).json({ success: false, error: error.message });
    }
};
module.exports = { getPedidos, createPedido, updatePedido, deletePedido, reclamarPedidos};  