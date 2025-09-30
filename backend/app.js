require('dotenv').config(); // Cargar variables de entorno del .env
const express = require('express');
const http = require('http'); // Necesario para Socket.IO

const cors = require('cors');
const authRoutes = require('./routes/authRoutes'); // Importamos las rutas de autenticación
const articuloRoutes = require('./routes/articuloRoutes'); 
const movimientoRoutes = require('./routes/movimientoRoutes');
const proveedorRoutes = require('./routes/proveedorRoutes');

const app = express();
const server = http.createServer(app); // Creamos el servidor HTTP
const socket = require('./socket'); // Importa el manejador de socket
socket.init(server); // Inicializa Socket.IO usando el manejador externo

// Middlewares
app.use(cors()); // Permite peticiones desde el frontend
app.use(express.json()); // Permite a Express leer JSON en el body de las peticiones

// Rutas
app.use('/api', authRoutes); // Montamos las rutas de autenticación en /api
app.use('/api', articuloRoutes); 
app.use('/api', movimientoRoutes); 
app.use('/api', proveedorRoutes);


// El manejador de conexiones está en socket.js

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});

// Exportamos app y server para usarlo en otros archivos
module.exports = { app, server };
