const { db } = require('../config/firebase');

function createBatch() {
    return db.batch();
}

async function commitBatch(batch) {
    await batch.commit();
}

module.exports = { createBatch, commitBatch };
