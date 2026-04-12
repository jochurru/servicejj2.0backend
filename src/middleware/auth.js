// src/middleware/auth.js
const validarApiKey = (req, res, next) => {
const apiKey = req.header('x-api-key'); // Buscamos la llave en este encabezado

if (!apiKey || apiKey !== process.env.API_KEY_SECRET) {
return res.status(401).json({ 
    success: false, 
    mensaje: "Acceso denegado. Llave de API inválida o ausente." 
});
}

next(); // Si la llave es correcta, dejamos pasar al siguiente paso
};

module.exports = validarApiKey;