require('dotenv').config(); // Cargar variables de entorno del .env
const express = require('express');
const http = require('http'); // Necesario para Socket.IO
const { Server } = require('socket.io');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes'); // Importamos las rutas de autenticación
const articuloRoutes = require('./routes/articuloRoutes'); 
const movimientoRoutes = require('./routes/movimientoRoutes');

const app = express();
const server = http.createServer(app); // Creamos el servidor HTTP
const io = new Server(server, { // Configuramos Socket.IO
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:8080", // URL de tu frontend
        methods: ["GET", "POST"]
    }
});

// Middlewares
app.use(cors()); // Permite peticiones desde el frontend
app.use(express.json()); // Permite a Express leer JSON en el body de las peticiones

// Rutas
app.use('/api', authRoutes); // Montamos las rutas de autenticación en /api
app.use('/api', articuloRoutes); 
app.use('/api', movimientoRoutes); 


// Manejador de Socket.IO (lo usaremos más adelante, pero lo dejamos listo)
io.on('connection', (socket) => {
    console.log(`Nuevo cliente conectado: ${socket.id}`);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});

// Exportamos io para usarlo en otros archivos
module.exports = { app, server, io };
