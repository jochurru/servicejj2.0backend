const admin = require('firebase-admin');
const { db } = require('../config/firebase');

async function verifyAdmin(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                mensaje: 'Autenticación requerida. Token no proporcionado.',
            });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decoded = await admin.auth().verifyIdToken(idToken);
        const userSnap = await db.collection('usuarios').doc(decoded.uid).get();

        if (!userSnap.exists) {
            return res.status(403).json({
                success: false,
                mensaje: 'Usuario no registrado en el sistema.',
            });
        }

        const data = userSnap.data();
        const isAdmin = data.role === 'admin' || data.rol === 'admin';

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                mensaje: 'Acceso denegado. Se requiere rol de administrador.',
            });
        }

        req.authUser = {
            uid: decoded.uid,
            email: decoded.email,
        };

        next();
    } catch {
        return res.status(401).json({
            success: false,
            mensaje: 'Token inválido o expirado.',
        });
    }
}

/**
 * GET público: sin Bearer → sigue al handler (req.isAdmin === false).
 * Con Bearer válido y rol admin → req.isAdmin === true.
 * Bearer inválido o usuario no admin → 401 / 403.
 */
async function optionalAdmin(req, res, next) {
    req.isAdmin = false;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    try {
        const idToken = authHeader.split('Bearer ')[1];
        const decoded = await admin.auth().verifyIdToken(idToken);
        const userSnap = await db.collection('usuarios').doc(decoded.uid).get();

        if (!userSnap.exists) {
            return res.status(403).json({
                success: false,
                mensaje: 'Usuario no registrado en el sistema.',
            });
        }

        const data = userSnap.data();
        const isAdmin = data.role === 'admin' || data.rol === 'admin';

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                mensaje: 'Acceso denegado. Se requiere rol de administrador.',
            });
        }

        req.authUser = {
            uid: decoded.uid,
            email: decoded.email,
        };
        req.isAdmin = true;
        next();
    } catch {
        return res.status(401).json({
            success: false,
            mensaje: 'Token inválido o expirado.',
        });
    }
}

verifyAdmin.optionalAdmin = optionalAdmin;
module.exports = verifyAdmin;
