require('dotenv').config();

const { createApp } = require('./src/app');

const app = createApp();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
