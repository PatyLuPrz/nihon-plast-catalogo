// backend/routes/proveedorRoutes.js
const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController');
const { protect } = require('../middlewares/authMiddleware');

// Listar proveedores
router.get('/proveedores', protect, proveedorController.getProveedores);
// Crear proveedor
router.post('/proveedores', protect, proveedorController.createProveedor);
// Editar proveedor
router.put('/proveedores/:id', protect, proveedorController.updateProveedor);
// Eliminar proveedor (baja lógica)
router.delete('/proveedores/:id', protect, proveedorController.deleteProveedor);

module.exports = router;
