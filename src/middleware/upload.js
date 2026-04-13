const multer = require('multer');
const path = require('path');

// Configuración básica: guardado temporal en RAM
const storage = multer.diskStorage({}); 

const upload = multer({
storage,
limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB por foto
fileFilter: (req, file, cb) => {
const filetypes = /jpeg|jpg|png|webp/;
const mimetype = filetypes.test(file.mimetype);
if (mimetype) return cb(null, true);
cb(new Error("Solo se permiten imágenes (jpeg, jpg, png, webp)"));
}
});

module.exports = upload;