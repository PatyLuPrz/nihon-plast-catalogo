const express = require('express');
const router = express.Router();
const articuloController = require('../controllers/articuloController');
const { protect } = require('../middlewares/authMiddleware');

// TODAS estas rutas están protegidas por el middleware 'protect'

// GET /api/articulos/:id (Obtener uno por ID)
router.get('/articulos/:id', protect, articuloController.getArticuloById); 

// GET /api/articulos (Obtener todos)
router.get('/articulos', protect, articuloController.getArticulos); 

// POST /api/articulos
router.post('/articulos', protect, articuloController.createArticulo); 

// PUT /api/articulos/:id
router.put('/articulos/:id', protect, articuloController.updateArticulo); 

// DELETE /api/articulos/:id (Borrado Lógico)
router.delete('/articulos/:id', protect, articuloController.deleteArticulo);

module.exports = router;