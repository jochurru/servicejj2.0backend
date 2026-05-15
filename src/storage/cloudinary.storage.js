const cloudinary = require('../config/cloudinary');

const UPLOAD_FOLDER = 'service-jj-pedidos';

async function uploadMany(files) {
    if (!files || files.length === 0) {
        return [];
    }

    const uploadPromises = files.map((file) =>
        cloudinary.uploader.upload(file.path, { folder: UPLOAD_FOLDER })
    );
    const results = await Promise.all(uploadPromises);
    return results.map((result) => result.secure_url);
}

module.exports = { uploadMany };
