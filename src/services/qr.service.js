const QRCode = require('qrcode');
const cloudinary = require('../config/cloudinary');
const { normalizeTicket } = require('../domain/id-generator');

const QR_FOLDER = 'service-jj-qr';

function assertCloudinaryConfigured() {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        throw new Error(
            'Cloudinary no está configurado: definen CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET'
        );
    }
}

/**
 * URL pública que codificará el QR (misma que verá el cliente al escanear).
 * @param {string} idCorto - ej. SJ-1042 (se normaliza SJ- / mayúsculas)
 */
function buildTrackingUrl(idCorto) {
    const ticket = normalizeTicket(String(idCorto));
    const base = (process.env.FRONTEND_URL || 'https://servicejj.vercel.app').replace(/\/$/, '');
    return `${base}/seguimiento/${ticket}`;
}

function cloudinaryPublicIdForTicket(ticket) {
    return normalizeTicket(ticket).replace(/[^a-zA-Z0-9-_]/g, '_');
}

/**
 * Sube un PNG en memoria a Cloudinary usando upload_stream (sin archivo en disco).
 * @param {Buffer} buffer - PNG del QR
 * @param {string} publicId - identificador estable por ticket (sin carpeta)
 * @returns {Promise<string>} secure_url
 */
function uploadQrPngBuffer(buffer, publicId) {
    assertCloudinaryConfigured();
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        return Promise.reject(new Error('Buffer de QR inválido o vacío'));
    }

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: QR_FOLDER,
                public_id: publicId,
                resource_type: 'image',
                format: 'png',
                overwrite: true,
                invalidate: true,
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }
                const url = result?.secure_url;
                if (!url) {
                    return reject(new Error('Cloudinary no devolvió secure_url al subir el QR'));
                }
                resolve(url);
            }
        );

        stream.on('error', reject);
        stream.end(buffer);
    });
}

/**
 * Genera PNG con qrcode y lo sube. Debe completarse antes de persistir el pedido en Firestore.
 * @param {string} idCorto
 * @returns {Promise<{ qrUrl: string, qrContenido: string, idCorto: string }>}
 */
async function generateAndUpload(idCorto) {
    const ticket = normalizeTicket(String(idCorto));
    const urlSeguimiento = buildTrackingUrl(ticket);

    const buffer = await QRCode.toBuffer(urlSeguimiento, {
        type: 'png',
        width: 512,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: { dark: '#000000', light: '#FFFFFF' },
    });

    const publicId = cloudinaryPublicIdForTicket(ticket);
    const qrUrl = await uploadQrPngBuffer(buffer, publicId);

    return { qrUrl, qrContenido: urlSeguimiento, idCorto: ticket };
}

module.exports = {
    generateAndUpload,
    buildTrackingUrl,
    uploadQrPngBuffer,
    normalizeTicket,
};
