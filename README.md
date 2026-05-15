# Service JJ — Backend

API REST en **Node.js** y **Express 5** para la gestión de pedidos de taller de Service JJ. Persistencia en **Firestore** (Firebase Admin), imágenes en **Cloudinary**, validación por capas y endpoints públicos de seguimiento.

**Repositorio:** [github.com/jochurru/servicejj2.0backend](https://github.com/jochurru/servicejj2.0backend)

---

## Características

- CRUD de pedidos con subida de hasta **5 fotos** por pedido (procesadas con Sharp, almacenadas en Cloudinary).
- **Doble escritura:** colecciones de pedidos internos y datos públicos de seguimiento.
- Tickets cortos con prefijo `SJ-` para consulta y QR.
- **Reclamo de pedidos** por email (vinculación con `clienteId` de Firebase Auth).
- Seguimiento **público** sin API key (solo datos de estado, no datos sensibles del taller).
- Rate limiting, CORS configurable y middleware de errores centralizado.
- Autenticación de rutas administrativas mediante header `x-api-key`.

---

## Stack tecnológico

| Área        | Tecnología        |
|------------|-------------------|
| Runtime    | Node.js           |
| Framework  | Express 5         |
| Base datos | Firestore (Admin SDK) |
| Archivos   | Cloudinary, Multer, Sharp |
| Seguridad  | express-rate-limit, API key |
| Config     | dotenv            |

---

## Arquitectura

El código sigue una estructura en capas:

```
index.js                 # Punto de entrada: carga .env y levanta el servidor
src/
├── app.js               # Factory Express: CORS, JSON, rate limit, rutas
├── routes/              # Definición de endpoints
├── controllers/         # HTTP → servicios
├── services/            # Lógica de negocio
├── repositories/        # Acceso a Firestore
├── domain/              # Entidades, generación de IDs, errores
├── dto/                 # Parseo y normalización de entrada
├── middleware/          # API key, upload, manejo de errores
├── storage/             # Adaptador Cloudinary
└── config/              # Firebase Admin y Cloudinary
```

---

## Requisitos previos

- Node.js 18+
- Proyecto Firebase con **Firestore** y cuenta de servicio (service account)
- Cuenta **Cloudinary** con API key y secret
- Frontend o cliente HTTP para probar (por defecto CORS permite `http://localhost:5173`)

---

## Instalación

```bash
git clone https://github.com/jochurru/servicejj2.0backend.git
cd servicejj2.0backend
npm install
```

### Variables de entorno

Creá `.env` en la raíz (no se commitea):

```env
PORT=5000

# Debe coincidir con VITE_SERVICE_JJ_API_KEY del frontend
API_KEY_SECRET=tu_clave_secreta_larga

# Origen del frontend (opcional; por defecto localhost:5173)
CORS_ORIGIN=http://localhost:5173

# Firebase Admin (JSON de cuenta de servicio → variables)
FB_PROJECT_ID=
FB_CLIENT_EMAIL=
FB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**`FB_PRIVATE_KEY`:** en el `.env` usá comillas y `\n` literales para los saltos de línea, o pegá la clave en una sola línea; el código reemplaza `\\n` por saltos reales.

### Ejecución

```bash
npm run dev
# o
npm start
```

Servidor por defecto: [http://localhost:5000](http://localhost:5000)  
Health check: `GET /` → texto de confirmación.

---

## Scripts disponibles

| Comando        | Descripción              |
|---------------|--------------------------|
| `npm start`   | Inicia el servidor       |
| `npm run dev` | Igual que `start`        |

---

## API — Pedidos

Base path: **`/api/pedidos`**

Todas las rutas bajo `/api/` tienen **rate limit**: 20 solicitudes por IP cada 15 minutos.

### Endpoints públicos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/seguimiento/:idCorto` | Estado público del ticket (`SJ-XXXX` o solo número) |
| `POST` | `/reclamar` | Vincula pedidos al usuario por email / `clienteId` |

**Body `POST /reclamar` (JSON):**

```json
{
  "email": "cliente@ejemplo.com",
  "clienteId": "uid-firebase-opcional"
}
```

El email se guarda en minúsculas.

### Endpoints protegidos (header `x-api-key`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/` | Lista todos los pedidos |
| `GET` | `/ticket/:idCorto` | Busca un pedido por ticket |
| `POST` | `/` | Crea pedido (`multipart/form-data`) |
| `PUT` | `/:id` | Actualiza pedido (JSON) |
| `DELETE` | `/:id` | Elimina pedido |

**Header requerido:**

```
x-api-key: <API_KEY_SECRET>
```

**`POST /` — campos del formulario:**

| Campo       | Tipo   | Descripción              |
|------------|--------|--------------------------|
| `nombre`   | string | Cliente                  |
| `equipo`   | string | Tipo de equipo           |
| `modelo`   | string | Opcional                 |
| `falla`    | string | Descripción del problema |
| `telefono` | string | Contacto                 |
| `email`    | string | Se normaliza a minúsculas |
| `clienteId`| string | UID Firebase si ya está logueado |
| `fotos`    | file[] | Hasta 5 imágenes         |

**Respuesta creación (201):**

```json
{
  "success": true,
  "id": "firestore-doc-id",
  "idCorto": "SJ-1234",
  "mensaje": "..."
}
```

**`PUT /:id` — ejemplo de body (JSON):** estado, notas internas, datos de seguimiento según lo definido en `update-pedido.dto.js`.

---

## Seguridad

- Rutas de administración exigen `x-api-key` igual a `API_KEY_SECRET`.
- Seguimiento y reclamo no usan API key; no exponen datos internos del taller.
- CORS restringido al origen del frontend (`CORS_ORIGIN` o localhost por defecto).
- Límite de tamaño JSON: 50 KB.
- No subas `.env` ni credenciales JSON de Firebase al repositorio.

---

## Firestore (referencia)

El backend usa colecciones gestionadas desde `repositories/` (pedidos completos y documentos de seguimiento público). Los nombres exactos y el esquema de campos están definidos en:

- `src/repositories/pedidos.repository.js`
- `src/repositories/seguimiento.repository.js`
- `src/domain/pedido.entity.js` / `seguimiento.entity.js`

Alineá las **reglas de seguridad** de Firestore en la consola Firebase con el modelo de acceso del frontend (Auth + rol `admin` en `usuarios/{uid}`).

---

## Despliegue

1. Configurá todas las variables de entorno en el hosting (Railway, Render, Cloud Run, VPS, etc.).
2. Ajustá `CORS_ORIGIN` al dominio del frontend en producción.
3. Usá HTTPS en producción; el frontend debe apuntar `VITE_API_URL` a `https://tu-api.com/api`.
4. Asegurate de que la cuenta de servicio de Firebase tenga permisos de lectura/escritura en Firestore.

---

## Enlaces relacionados

- **Frontend:** [servicejj2.0](https://github.com/jochurru/servicejj2.0)
- Express 5: [expressjs.com](https://expressjs.com/)
- Firebase Admin: [firebase.google.com/docs/admin/setup](https://firebase.google.com/docs/admin/setup)
- Cloudinary Node SDK: [cloudinary.com/documentation/node_integration](https://cloudinary.com/documentation/node_integration)
