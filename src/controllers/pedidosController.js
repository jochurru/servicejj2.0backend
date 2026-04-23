const { db } = require('../config/firebase');
const cloudinary = require('../config/cloudinary');

// 1. OBTENER TODOS LOS PEDIDOS (PRIVADO - ADMIN)
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

// 2. CREAR PEDIDO (Doble escritura con Cloudinary)
const createPedido = async (req, res) => {
    try {
        const { nombre, equipo, modelo, falla, telefono, email, clienteId } = req.body;
        const archivos = req.files; 

        let fotosUrls = [];
        if (archivos && archivos.length > 0) {
            const uploadPromises = archivos.map(file => 
                cloudinary.uploader.upload(file.path, { folder: 'service-jj-pedidos' })
            );
            const results = await Promise.all(uploadPromises);
            fotosUrls = results.map(result => result.secure_url);
        }

        const ahora = new Date();
        const idRelacional = ahora.getFullYear().toString() + 
                            (ahora.getMonth() + 1).toString().padStart(2, '0') + 
                            ahora.getDate().toString().padStart(2, '0') + 
                            ahora.getHours().toString().padStart(2, '0') + 
                            ahora.getMinutes().toString().padStart(2, '0') + 
                            ahora.getSeconds().toString().padStart(2, '0');
        
        const idCorto = `SJ-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        const batch = db.batch();

        const refPrivada = db.collection('pedidos').doc(idRelacional);
        batch.set(refPrivada, {
            pedidoId: idRelacional,
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
            fechaCreacion: ahora,
            notasTecnico: []
        });

        const refPublica = db.collection('seguimiento').doc(idRelacional);
        batch.set(refPublica, {
            idCorto,
            equipo: `${equipo} ${modelo || ""}`.trim(),
            falla: falla.trim(),
            estado: 'pendiente',
            actualizado: ahora
        });

        await batch.commit(); 

        res.status(201).json({ 
            success: true, 
            id: idRelacional,
            idCorto: idCorto,
            mensaje: "Pedido registrado y sincronizado con éxito." 
        });

    } catch (error) {
        console.error("Error al crear pedido:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 3. UPDATE (CON SINCRONIZACIÓN DE DOBLE ESCRITURA) 🚀
const updatePedido = async (req, res) => {
    try {
        const { id } = req.params;
        const nuevosDatos = req.body; // Puede traer 'estado' y 'nuevaNota'

        const batch = db.batch();
        const refPrivada = db.collection('pedidos').doc(id);
        const refPublica = db.collection('seguimiento').doc(id);

        // Si viene una 'nuevaNota' la agregamos al array sin pisar lo anterior
        if (nuevosDatos.nuevaNota) {
            const notaObj = {
                fecha: new Date().toLocaleString('es-AR'),
                texto: nuevosDatos.nuevaNota
            };
            batch.update(refPrivada, {
                notasTecnico: require('firebase-admin').firestore.FieldValue.arrayUnion(notaObj),
                estado: nuevosDatos.estado || 'en reparación'
            });
        } else {
            batch.update(refPrivada, nuevosDatos);
        }

        // ⚠️ CLAVE: Sincronizamos el estado en la colección pública para que el cliente lo vea
        if (nuevosDatos.estado) {
            batch.update(refPublica, { 
                estado: nuevosDatos.estado,
                actualizado: new Date() 
            });
        }

        await batch.commit();
        res.json({ success: true, mensaje: "Pedido y seguimiento actualizados." });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 4. DELETE (TAMBIÉN BORRA EL SEGUIMIENTO)
const deletePedido = async (req, res) => {
    try {
        const { id } = req.params;
        const batch = db.batch();
        batch.delete(db.collection('pedidos').doc(id));
        batch.delete(db.collection('seguimiento').doc(id));
        await batch.commit();
        res.json({ success: true, mensaje: "Pedido eliminado de todas las bases." });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 5. RECLAMAR PEDIDOS
const reclamarPedidos = async (req, res) => {
    try {
        const emailRecibido = req.body.email.trim().toLowerCase();
        const clienteId = req.body.clienteId || null; 

        const snapshot = await db.collection('pedidos')
                                .where('email', '==', emailRecibido)
                                .get();

        if (snapshot.empty) {
            return res.json({ success: false, mensaje: "No hay pedidos con ese mail." });
        }

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { clienteId: clienteId });
        });

        await batch.commit();
        res.json({ success: true, message: `Se vincularon ${snapshot.size} pedidos.` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 6. SEGUIMIENTO PÚBLICO (EL QUE USA EL BUSCADOR DEL HOME)
const getSeguimientoPublico = async (req, res) => {
    try {
        let { idCorto } = req.params;
        
        // 1. Limpiamos espacios y pasamos a Mayúsculas
        let ticket = idCorto.trim().toUpperCase();

        // 2. 🧠 LÓGICA ANTI-DUPLICADO: 
        // Si el usuario escribió "SJ-SJ-MPPF" o "SJ-MPPF" o "MPPF",
        // lo normalizamos para que siempre sea "SJ-MPPF"
        if (ticket.startsWith('SJ-SJ-')) {
            ticket = ticket.replace('SJ-SJ-', 'SJ-');
        } else if (!ticket.startsWith('SJ-')) {
            ticket = `SJ-${ticket}`;
        }

        console.log("Buscando en Firebase:", ticket);

        const snapshot = await db.collection('seguimiento')
                                .where('idCorto', '==', ticket)
                                .limit(1)
                                .get();
        
        if (snapshot.empty) {
            return res.status(404).json({ success: false, message: "Ticket no encontrado" });
        }

        const data = snapshot.docs[0].data();
        res.json({ success: true, ...data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
module.exports = { getPedidos, createPedido, updatePedido, deletePedido, reclamarPedidos, getSeguimientoPublico};