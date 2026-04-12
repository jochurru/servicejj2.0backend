const admin = require('firebase-admin');

// Creamos el objeto de credenciales mapeando las variables del .env
const serviceAccount = {
projectId: process.env.FB_PROJECT_ID,
privateKey: process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n'), // Crucial para que Google entienda los saltos de línea
clientEmail: process.env.FB_CLIENT_EMAIL,
};

// Evitamos inicializar más de una vez si el servidor se reinicia (Hot Reload)
if (!admin.apps.length) {
admin.initializeApp({
credential: admin.credential.cert(serviceAccount)
});
}

const db = admin.firestore();

module.exports = { db };