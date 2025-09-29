const { query, pool } = require('../config/db'); 


// Función auxiliar para obtener el usuario modificado y la máquina
const getUserInfo = (req) => {
    // Usamos la información decodificada del JWT (ID del usuario)
    const ClaUserMod = req.user ? req.user.id : 0; // 0 si no hay usuario
    const NombrePcMod = 'WEB_APP'; // Podría ser la IP o hostname de la máquina cliente
    return { ClaUserMod, NombrePcMod };
};

// 1. OBTENER TODOS los Artículos (Read List)
exports.getArticulos = async (req, res) => {
    try {
        const result = await query(
            `SELECT 
                A."IdArticulo", A."CodArticulo", A."NomArticulo", A."StockActual", 
                A."FechaAlta", 
                CS."CantidadMaxima", CS."CantidadMinima", 
                P."NomProveedor"
             FROM "Articulos" AS A
             JOIN "CfgStock" AS CS ON A."IdCfgStock" = CS."IdCfgStock"
             LEFT JOIN "Proveedores" AS P ON A."IdProveedor" = P."IdProveedor"
             WHERE A."BajaLogica" = TRUE 
             ORDER BY A."NomArticulo" ASC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener artículos:', error);
        res.status(500).json({ msg: 'Error interno del servidor al obtener artículos.' });
    }
};

// 1.1. OBTENER UN ARTÍCULO por ID (Read One)
exports.getArticuloById = async (req, res) => {
    const { id } = req.params;

    // Validación: ID numérico
    if (isNaN(parseInt(id))) {
        return res.status(400).json({ msg: 'El ID del artículo debe ser un número válido.' });
    }

    try {
        const result = await query(
            `SELECT 
                A."IdArticulo", A."CodArticulo", A."NomArticulo", A."StockActual", 
                A."IdProveedor", A."IdCfgStock", A."FechaAlta", 
                CS."CantidadMaxima", CS."CantidadMinima", 
                P."NomProveedor"
             FROM "Articulos" AS A
             JOIN "CfgStock" AS CS ON A."IdCfgStock" = CS."IdCfgStock"
             LEFT JOIN "Proveedores" AS P ON A."IdProveedor" = P."IdProveedor"
             WHERE A."IdArticulo" = $1 AND A."BajaLogica" = TRUE`,
            [id]
        );

        const articulo = result.rows[0];

        if (!articulo) {
            return res.status(404).json({ msg: 'Artículo no encontrado o dado de baja.' });
        }

        res.json(articulo);
    } catch (error) {
        console.error('Error al obtener artículo por ID:', error);
        res.status(500).json({ msg: 'Error interno del servidor al obtener el artículo.' });
    }
};

// 2. CREAR un nuevo Artículo (Create)
exports.createArticulo = async (req, res) => {
    const { CodArticulo, NomArticulo, IdProveedor, CantidadMaxima, CantidadMinima } = req.body;
    const { ClaUserMod, NombrePcMod } = getUserInfo(req); // Info de auditoría
    const client = await pool.connect(); // Obtener un cliente de conexión para la transacción

   // **Validaciones 1: Campos Requeridos**
    if (!CodArticulo || !NomArticulo || IdProveedor === undefined || CantidadMaxima === undefined || CantidadMinima === undefined) {
        return res.status(400).json({ msg: 'Faltan campos obligatorios (Código, Nombre, Proveedor, Cant. Máx, Cant. Mín).' });
    }
    
    // **Validaciones 2: Tipo de Datos y Rangos**
    const isNumeric = (val) => !isNaN(parseFloat(val)) && isFinite(val) && val >= 0;

    if (!isNumeric(IdProveedor) || !isNumeric(CantidadMaxima) || !isNumeric(CantidadMinima)) {
        return res.status(400).json({ msg: 'Proveedor, Cantidad Máxima y Mínima deben ser números no negativos.' });
    }
    
    if (parseFloat(CantidadMaxima) <= parseFloat(CantidadMinima)) {
        return res.status(400).json({ msg: 'La Cantidad Máxima debe ser estrictamente mayor que la Cantidad Mínima.' });
    }

    try {
        await client.query('BEGIN'); // Iniciar la Transacción

        // Paso A: Insertar configuración de Stock (CfgStock)
        const cfgStockResult = await client.query(
            `INSERT INTO "CfgStock" (
                "CantidadMaxima", "CantidadMinima", "FechaAlta", "FechaUltMod", 
                "ClaUserMod", "NombrePcMod", "BajaLogica"
            ) 
            VALUES ($1, $2, NOW(), NOW(), $3, $4, TRUE) 
            RETURNING "IdCfgStock"`,
            [CantidadMaxima, CantidadMinima, ClaUserMod, NombrePcMod]
        );
        const IdCfgStock = cfgStockResult.rows[0].IdCfgStock;

        // Paso B: Insertar el Artículo (StockActual inicial en 0)
        const articuloResult = await client.query(
            `INSERT INTO "Articulos" (
                "CodArticulo", "NomArticulo", "FechaAlta", "StockActual", 
                "IdProveedor", "IdCfgStock", "FechaUltMod", "ClaUserMod", 
                "NombrePcMod", "BajaLogica"
            ) 
            VALUES ($1, $2, NOW(), 0, $3, $4, NOW(), $5, $6, TRUE) 
            RETURNING *`,
            [CodArticulo, NomArticulo, IdProveedor, IdCfgStock, ClaUserMod, NombrePcMod]
        );

        await client.query('COMMIT'); // Confirmar la Transacción

        res.status(201).json({ msg: 'Artículo creado exitosamente', articulo: articuloResult.rows[0] });

    } catch (error) {
        await client.query('ROLLBACK'); // Revertir si algo falla
        console.error('Error al crear artículo (ROLLBACK):', error);
        res.status(500).json({ msg: 'Error interno del servidor al crear artículo.' });
    } finally {
        client.release(); // Liberar el cliente de conexión
    }
};

// 3. ACTUALIZAR un Artículo (Update)
exports.updateArticulo = async (req, res) => {
    const { id } = req.params;
    const { NomArticulo, CantidadMaxima, CantidadMinima, IdProveedor } = req.body;
    const { ClaUserMod, NombrePcMod } = getUserInfo(req);
    const client = await pool.connect();

     // **Validación 1: ID numérico**
    if (isNaN(parseInt(id))) {
        return res.status(400).json({ msg: 'El ID del artículo debe ser un número válido.' });
    }

    // **Validación 2: Campos Requeridos y Lógica**
    if (!NomArticulo || IdProveedor === undefined || CantidadMaxima === undefined || CantidadMinima === undefined) {
        return res.status(400).json({ msg: 'Faltan campos obligatorios para la actualización.' });
    }

    // **Validación 3: Tipo de Datos y Rangos**
    const isNumeric = (val) => !isNaN(parseFloat(val)) && isFinite(val) && val >= 0;

    if (!isNumeric(IdProveedor) || !isNumeric(CantidadMaxima) || !isNumeric(CantidadMinima)) {
        return res.status(400).json({ msg: 'Proveedor, Cantidad Máxima y Mínima deben ser números no negativos.' });
    }
    
    if (parseFloat(CantidadMaxima) <= parseFloat(CantidadMinima)) {
        return res.status(400).json({ msg: 'La Cantidad Máxima debe ser estrictamente mayor que la Cantidad Mínima.' });
    }

    try {
        await client.query('BEGIN');

        // Paso A: Obtener el IdCfgStock del artículo
        const articulo = await client.query(
            'SELECT "IdCfgStock" FROM "Articulos" WHERE "IdArticulo" = $1 AND "BajaLogica" = TRUE', 
            [id]
        );
        if (articulo.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ msg: 'Artículo no encontrado.' });
        }
        const IdCfgStock = articulo.rows[0].IdCfgStock;

        // Paso B: Actualizar CfgStock
        await client.query(
            `UPDATE "CfgStock" SET 
                "CantidadMaxima" = $1, "CantidadMinima" = $2, "FechaUltMod" = NOW(), 
                "ClaUserMod" = $3, "NombrePcMod" = $4
             WHERE "IdCfgStock" = $5`,
            [CantidadMaxima, CantidadMinima, ClaUserMod, NombrePcMod, IdCfgStock]
        );

        // Paso C: Actualizar Artículo
        const result = await client.query(
            `UPDATE "Articulos" SET 
                "NomArticulo" = $1, "IdProveedor" = $2, "FechaUltMod" = NOW(), 
                "ClaUserMod" = $3, "NombrePcMod" = $4 
             WHERE "IdArticulo" = $5 RETURNING *`,
            [NomArticulo, IdProveedor, ClaUserMod, NombrePcMod, id]
        );

        await client.query('COMMIT');

        res.json({ msg: 'Artículo actualizado exitosamente', articulo: result.rows[0] });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar artículo (ROLLBACK):', error);
        res.status(500).json({ msg: 'Error interno del servidor al actualizar artículo.' });
    } finally {
        client.release();
    }
};

// 4. ELIMINAR un Artículo (Delete - Borrado Lógico)
exports.deleteArticulo = async (req, res) => {
    const { id } = req.params;
    const { ClaUserMod, NombrePcMod } = getUserInfo(req);

    // **Validación 1: ID numérico**
    if (isNaN(parseInt(id))) {
        return res.status(400).json({ msg: 'El ID del artículo debe ser un número válido.' });
    }

    try {
        // Realizar Borrado Lógico
        const result = await query(
            `UPDATE "Articulos" SET 
                "BajaLogica" = FALSE, "FechaUltMod" = NOW(), 
                "ClaUserMod" = $1, "NombrePcMod" = $2 
             WHERE "IdArticulo" = $3 AND "BajaLogica" = TRUE RETURNING *`,
            [ClaUserMod, NombrePcMod, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Artículo no encontrado o ya fue dado de baja.' });
        }

        res.json({ msg: 'Artículo eliminado (borrado lógico) exitosamente' });
    } catch (error) {
        console.error('Error al eliminar artículo:', error);
        res.status(500).json({ msg: 'Error interno del servidor al eliminar artículo.' });
    }
};