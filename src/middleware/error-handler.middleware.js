const { AppError } = require('../domain/errors');

function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof AppError) {
        const body = { success: false };
        if (err.statusCode === 404) {
            body.message = err.message;
        } else {
            body.mensaje = err.message;
        }
        return res.status(err.statusCode).json(body);
    }

    if (err.message && err.message.includes('Solo se permiten imágenes')) {
        return res.status(400).json({ success: false, mensaje: err.message });
    }

    console.error('Error no controlado:', err);
    res.status(500).json({ success: false, error: err.message });
}

module.exports = errorHandler;
