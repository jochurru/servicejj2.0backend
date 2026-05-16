const { db } = require('../config/firebase');

const COLLECTION = 'productos';

function mapProductDoc(doc) {
    const data = doc.data() || {};
    const { id: _idEnDato, ...rest } = data;
    return { ...rest, id: doc.id };
}

async function findAllActive() {
    const snapshot = await db.collection(COLLECTION).get();
    return snapshot.docs
        .map(mapProductDoc)
        .filter((p) => p.activo !== false)
        .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
}

async function findAll() {
    const snapshot = await db.collection(COLLECTION).get();
    return snapshot.docs.map(mapProductDoc).sort((a, b) => {
        const ta = a.updatedAt?.toMillis?.() ?? a.updatedAt ?? 0;
        const tb = b.updatedAt?.toMillis?.() ?? b.updatedAt ?? 0;
        return tb - ta;
    });
}

async function findById(id) {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return mapProductDoc(doc);
}

async function create(data) {
    const ref = db.collection(COLLECTION).doc();
    const payload = { ...data, createdAt: new Date(), updatedAt: new Date() };
    await ref.set(payload);
    return { id: ref.id, ...payload };
}

async function update(id, data) {
    const ref = db.collection(COLLECTION).doc(id);
    const payload = { ...data, updatedAt: new Date() };
    await ref.update(payload);
    return findById(id);
}

async function remove(id) {
    await db.collection(COLLECTION).doc(id).delete();
}

module.exports = {
    findAllActive,
    findAll,
    findById,
    create,
    update,
    remove,
};
