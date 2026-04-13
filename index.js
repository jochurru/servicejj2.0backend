const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit'); // <--- 1. Importás el paquete
require('dotenv').config();

const pedidosRoutes = require('./src/routes/pedidosRoutes');

const app = express();

// --- MIDDLEWARES GLOBALES ---
app.use(cors());
app.use(express.json({ limit: '50kb' })); 

// 2. CONFIGURACIÓN DEL LIMITADOR
const limiter = rateLimit({
windowMs: 15 * 60 * 1000, // 15 minutos
max:20, // Límite de 20 peticiones por ventana de 15 min
message: {
success: false,
mensaje: "Demasiados intentos desde esta IP, por favor intentá más tarde."
}
});

// 3. APLICAR EL LIMITADOR (Solo a las rutas que empiezan con /api)
app.use('/api/', limiter); 

const PORT = process.env.PORT || 5000;

// Ruta de bienvenida
app.get('/', (req, res) => {
res.send('Servidor de Service JJ funcionando 🚀');
});

// --- CONEXIÓN DE RUTAS ---
app.use('/api/pedidos', pedidosRoutes);

app.listen(PORT, () => {
console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});