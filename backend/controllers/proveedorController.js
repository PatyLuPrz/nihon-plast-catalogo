// backend/controllers/proveedorController.js
const { pool } = require('../config/db');

// Obtener todos los proveedores
exports.getProveedores = async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT "IdProveedor", "NomProveedor", "RFC" FROM "Proveedores" WHERE "BajaLogica" = TRUE ORDER BY "NomProveedor" ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ msg: 'Error interno al obtener proveedores.' });
  } finally {
    client.release();
  }
};

// Crear proveedor
exports.createProveedor = async (req, res) => {
  const { NomProveedor, RFC } = req.body;
  const client = await pool.connect();
  try {
    const result = await client.query(
      'INSERT INTO "Proveedores" ("NomProveedor", "RFC", "BajaLogica") VALUES ($1, $2, TRUE) RETURNING "IdProveedor", "NomProveedor", "RFC"',
      [NomProveedor, RFC]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({ msg: 'Error interno al crear proveedor.' });
  } finally {
    client.release();
  }
};

// Editar proveedor
exports.updateProveedor = async (req, res) => {
  const { id } = req.params;
  const { NomProveedor, RFC } = req.body;
  const client = await pool.connect();
  try {
    await client.query(
      'UPDATE "Proveedores" SET "NomProveedor" = $1, "RFC" = $2 WHERE "IdProveedor" = $3',
      [NomProveedor, RFC, id]
    );
    res.json({ msg: 'Proveedor actualizado.' });
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    res.status(500).json({ msg: 'Error interno al actualizar proveedor.' });
  } finally {
    client.release();
  }
};

// Eliminar proveedor (baja lógica)
exports.deleteProveedor = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query(
      'UPDATE "Proveedores" SET "BajaLogica" = FALSE WHERE "IdProveedor" = $1',
      [id]
    );
    res.json({ msg: 'Proveedor eliminado.' });
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    res.status(500).json({ msg: 'Error interno al eliminar proveedor.' });
  } finally {
    client.release();
  }
};
