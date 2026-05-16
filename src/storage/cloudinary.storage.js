const cloudinary = require('../config/cloudinary');

const DEFAULT_FOLDER = 'service-jj-pedidos';

/**
 * Obtiene public_id (con carpeta) desde una secure_url de Cloudinary.
 */
function publicIdFromSecureUrl(url) {
    if (!url || typeof url !== 'string') return null;
    try {
        const u = new URL(url);
        if (!u.hostname.includes('cloudinary.com')) return null;
        const parts = u.pathname.split('/').filter(Boolean);
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1) return null;
        let i = uploadIndex + 1;
        while (i < parts.length) {
            const seg = parts[i];
            if (/^v\d+$/i.test(seg)) {
                i += 1;
                continue;
            }
            if (seg.includes(',') && !seg.includes('.')) {
                i += 1;
                continue;
            }
            break;
        }
        if (i >= parts.length) return null;
        const rest = parts.slice(i).join('/');
        const lastDot = rest.lastIndexOf('.');
        return lastDot > 0 ? rest.slice(0, lastDot) : rest;
    } catch {
        return null;
    }
}

/**
 * Elimina un asset por su secure_url (best-effort; no lanza si falla).
 */
async function destroyBySecureUrl(url) {
    const publicId = publicIdFromSecureUrl(url);
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId, {
            resource_type: 'image',
            invalidate: true,
        });
    } catch (err) {
        console.warn('[Cloudinary] destroyBySecureUrl:', publicId, err.message);
    }
}

async function uploadMany(files, folder = DEFAULT_FOLDER) {
    if (!files || files.length === 0) {
        return [];
    }

    const uploadPromises = files.map((file) =>
        cloudinary.uploader.upload(file.path, { folder })
    );
    const results = await Promise.all(uploadPromises);
    return results.map((result) => result.secure_url);
}

module.exports = { uploadMany, destroyBySecureUrl, publicIdFromSecureUrl };
