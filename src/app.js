const express = require('express');
const cors = require('cors');
const pedidosRoutes = require('./routes/pedidos.routes');
const productosRoutes = require('./routes/productos.routes');
const contactRoutes = require('./routes/contact.routes');
const errorHandler = require('./middleware/error-handler.middleware');

function createApp() {
    const app = express();

    app.use((req, res, next) => {
        res.setHeader('X-ServiceJJ-Api', 'servicejj-backend');
        next();
    });

    app.use(cors({
        origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://127.0.0.1:5173'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    }));
    app.use(express.json({ limit: '50kb' }));

    app.get('/', (req, res) => {
        res.send('Servidor de Service JJ funcionando 🚀');
    });

    app.use('/api/pedidos', pedidosRoutes);
    app.use('/api/productos', productosRoutes);
    app.use('/api/contact', contactRoutes);

    app.use(errorHandler);

    return app;
}
module.exports = { createApp };
