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

    return snapshot.docs[0].data();
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

module.exports = {
    findByIdCorto,
    setInBatch,
    updateEstadoInBatch,
    updateWithNotaInBatch,
    deleteInBatch,
};
