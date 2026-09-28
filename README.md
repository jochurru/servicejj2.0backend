# Service JJ — Backend

Backend de **Service JJ** desarrollado con Node.js y Express para gestionar pedidos de servicio técnico, seguimiento público por ticket, carga de imágenes, autenticación de administradores y persistencia en Firestore.

Forma parte de una solución full-stack compuesta por un frontend en React y una API REST propia.

---

## 🚀 Funcionalidades

- Alta de pedidos de servicio técnico
- Carga de hasta 5 imágenes por pedido
- Generación de tickets cortos con formato `SJ-XXXX`
- Seguimiento público del estado de un pedido
- Vinculación de pedidos con usuarios autenticados
- Consulta y administración de pedidos
- Actualización y eliminación de registros
- Envío de correos electrónicos
- Generación de códigos QR
- Persistencia en Firestore
- Almacenamiento de imágenes en Cloudinary

---

## 🛠️ Stack tecnológico

![Node.js](https://img.shields.io/badge/-Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/-Express-000000?style=flat&logo=express&logoColor=white)
![Firebase](https://img.shields.io/badge/-Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)
![Cloudinary](https://img.shields.io/badge/-Cloudinary-3448C5?style=flat&logo=cloudinary&logoColor=white)

- Node.js
- Express 5
- Firebase Admin
- Firestore
- Cloudinary
- Multer
- Sharp
- Nodemailer
- QRCode
- dotenv
- CORS

---

## 🧱 Arquitectura

El backend está organizado en capas para separar responsabilidades y facilitar el mantenimiento y la evolución del proyecto.

```text
index.js
src/
├── app.js
├── config/
├── controllers/
├── domain/
├── dto/
├── middleware/
├── repositories/
├── routes/
├── services/
└── storage/

Responsabilidades principales
- routes/: definición de endpoints
- controllers/: manejo de requests y responses
- services/: lógica de negocio
- repositories/: acceso a Firestore
- domain/: entidades y reglas del dominio
- dto/: validación y normalización de datos
- middleware/: autenticación, autorización y manejo de errores
- storage/: integración con Cloudinary
- config/: configuración de Firebase y servicios externos
```
🔐Seguridad y acceso

El backend utiliza distintos niveles de acceso según el tipo de operación.
Endpoints públicos
- Seguimiento de pedidos por ticket
- Reclamo o vinculación de pedidos
Creación de pedidos
La creación de pedidos utiliza una API key enviada mediante el header:
x-api-key
Administración
Las operaciones administrativas requieren:
- autenticación mediante Firebase Auth
- token Bearer válido
- usuario registrado en Firestore
- rol admin
Esto se aplica a operaciones como:
- listar pedidos
- buscar pedidos por ticket
- actualizar pedidos
- eliminar pedidos

🌐 API principal

Base path:
/api/pedidos
Endpoints
Método	Ruta	Acceso	Descripción
GET	/seguimiento/:idCorto	Público	Consulta el estado de un pedido
POST	/reclamar	Público	Vincula pedidos con un usuario
POST	/	API key	Crea un nuevo pedido
GET	/ticket/:idCorto	Admin	Busca un pedido por ticket
GET	/	Admin	Lista pedidos
PUT	/:id	Admin	Actualiza un pedido
DELETE	/:id	Admin	Elimina un pedido

## 🖼️ Gestión de imágenes

Los pedidos pueden incluir hasta 5 imágenes.

El flujo utiliza:

- Multer para recepción de archivos
- Sharp para procesamiento de imágenes
- Cloudinary para almacenamiento

---

## 🔥 Persistencia

La aplicación utiliza **Firestore** mediante Firebase Admin SDK.

El acceso a datos está separado mediante repositories, manteniendo la lógica de negocio desacoplada de la base de datos.

---

## ▶️ Ejecución local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear archivo `.env`

Tomar como referencia el archivo:

```text
.env.example
```

Variables principales:

```env
PORT=5000

API_KEY_SECRET=

CORS_ORIGIN=

FB_PROJECT_ID=
FB_CLIENT_EMAIL=
FB_PRIVATE_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 3. Ejecutar el proyecto

```bash
npm run dev
```

o:

```bash
npm start
```

---

## 🔗 Proyecto relacionado

**Frontend:**  
https://github.com/jochurru/servicejj2.0

**Aplicación:**  
https://servicejj.com.ar/

---

## 📌 Estado del proyecto

Proyecto funcional en evolución.

El objetivo del backend es centralizar la gestión de pedidos de servicio técnico, mejorar la trazabilidad de cada equipo y ofrecer seguimiento tanto para clientes como para administradores.

---

## 👨‍💻 Autor

**Jonatan Churruarin**

**LinkedIn:**  
https://www.linkedin.com/in/jonatan-churruarin/

