const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Ruta para el LOGIN
// POST /api/login
router.post('/login', authController.loginUser);

// Ruta para REGISTRAR un nuevo usuario (solo para pruebas iniciales)
// POST /api/register
router.post('/register', authController.registerUser);

module.exports = router;