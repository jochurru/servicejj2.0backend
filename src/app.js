const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const pedidosRoutes = require('./routes/pedidos.routes');
const errorHandler = require('./middleware/error-handler.middleware');

function createApp() {
    const app = express();

    app.use(cors({
        origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://127.0.0.1:5173'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    }));
    app.use(express.json({ limit: '50kb' }));

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 20,
        message: {
            success: false,
            mensaje: 'Demasiados intentos desde esta IP, por favor intentá más tarde.'
        }
    });

    app.use('/api/', limiter);

    app.get('/', (req, res) => {
        res.send('Servidor de Service JJ funcionando 🚀');
    });

    app.use('/api/pedidos', pedidosRoutes);

    app.use(errorHandler);

    return app;
}

module.exports = { createApp };
