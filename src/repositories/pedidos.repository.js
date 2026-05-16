const admin = require('firebase-admin');
const { db } = require('../config/firebase');
const { buildNotaTecnico } = require('../domain/pedido.entity');

const COLLECTION = 'pedidos';

async function findAllOrdered() {
    const snapshot = await db.collection(COLLECTION).orderBy('pedidoId', 'desc').get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function findByEmail(email) {
    const snapshot = await db.collection(COLLECTION).where('email', '==', email).get();
    return snapshot.docs;
}

async function findByIdCorto(idCorto) {
    const snapshot = await db
        .collection(COLLECTION)
        .where('idCorto', '==', idCorto)
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
}

function setInBatch(batch, id, data) {
    const ref = db.collection(COLLECTION).doc(id);
    batch.set(ref, data);
}

function updateInBatch(batch, id, data) {
    const ref = db.collection(COLLECTION).doc(id);
    batch.update(ref, data);
}

function deleteInBatch(batch, id) {
    const ref = db.collection(COLLECTION).doc(id);
    batch.delete(ref);
}

function buildUpdateWithNota(nuevaNota, estado) {
    return {
        notasTecnico: admin.firestore.FieldValue.arrayUnion(
            buildNotaTecnico(nuevaNota, estado || 'en reparación')
        ),
        estado: estado || 'en reparación',
    };
}

async function updateQrUrl(id, qrUrl, qrContenido) {
    await db.collection(COLLECTION).doc(id).update({
        qrUrl,
        qrContenido: qrContenido || null,
    });
}

async function linkClienteIdToDocs(docs, clienteId) {
    const batch = db.batch();
    docs.forEach((doc) => {
        batch.update(doc.ref, { clienteId });
    });
    await batch.commit();
    return docs.length;
}

module.exports = {
    findAllOrdered,
    findByEmail,
    findByIdCorto,
    updateQrUrl,
    setInBatch,
    updateInBatch,
    deleteInBatch,
    buildUpdateWithNota,
    linkClienteIdToDocs
};
