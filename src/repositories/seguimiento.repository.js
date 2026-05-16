const admin = require('firebase-admin');
const { db } = require('../config/firebase');
const { buildNotaTecnico } = require('../domain/pedido.entity');

const COLLECTION = 'seguimiento';

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
    const raw = doc.data() || {};
    const { id: _ignoredId, ...rest } = raw;
    return { ...rest, id: doc.id };
}

function setInBatch(batch, id, data) {
    const ref = db.collection(COLLECTION).doc(id);
    batch.set(ref, data);
}

function updateEstadoInBatch(batch, id, estado, actualizado) {
    const ref = db.collection(COLLECTION).doc(id);
    batch.update(ref, { estado, actualizado });
}

function updateWithNotaInBatch(batch, id, nuevaNota, estado, actualizado) {
    const ref = db.collection(COLLECTION).doc(id);
    batch.update(ref, {
        estado: estado || 'en reparación',
        actualizado,
        notasTecnico: admin.firestore.FieldValue.arrayUnion(
            buildNotaTecnico(nuevaNota, estado || 'en reparación')
        ),
    });
}

function deleteInBatch(batch, id) {
    const ref = db.collection(COLLECTION).doc(id);
    batch.delete(ref);
}

async function updateQrUrl(id, qrUrl, qrContenido = null) {
    const patch = { qrUrl };
    if (qrContenido != null && qrContenido !== '') {
        patch.qrContenido = qrContenido;
    }
    await db.collection(COLLECTION).doc(id).update(patch);
}

module.exports = {
    findByIdCorto,
    updateQrUrl,
    setInBatch,
    updateEstadoInBatch,
    updateWithNotaInBatch,
    deleteInBatch,
};
