const validarApiKey = (req, res, next) => {
    const apiKey = req.header('x-api-key');

    if (!apiKey || apiKey !== process.env.API_KEY_SECRET) {
        return res.status(401).json({
            success: false,
            mensaje: 'Acceso denegado. Llave de API inválida o ausente.'
        });
    }

    next();
};

module.exports = validarApiKey;
