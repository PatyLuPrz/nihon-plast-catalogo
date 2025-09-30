const express = require('express');
const router = express.Router();
const movimientoController = require('../controllers/movimientoController');
const { protect } = require('../middlewares/authMiddleware');


// Rutas protegidas para movimientos de stock
router.post('/movimientos/entrada', protect, movimientoController.entradaInsumo);
router.post('/movimientos/salida', protect, movimientoController.salidaInsumo);

// Ruta para obtener historial de movimientos (GET)
router.get('/movimientos', protect, movimientoController.getHistorialMovimientos);

module.exports = router;