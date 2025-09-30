// ===============================================
// Historial de Movimientos (Entradas y Salidas)
// ===============================================
exports.getHistorialMovimientos = async (req, res) => {
    const client = await pool.connect();
    try {
        // Consulta combinada de entradas y salidas, unificando campos
        const result = await client.query(`
            SELECT E."IdEntrada" AS "IdMovimiento", E."IdArticulo", A."NomArticulo", 'ENTRADA' AS "TipoMovimiento", E."Cantidad", A."StockActual" AS "StockFinal", E."FechaMovimiento"
            FROM "Entradas" E
            JOIN "Articulos" A ON E."IdArticulo" = A."IdArticulo"
            WHERE E."BajaLogica" = TRUE
            UNION ALL
            SELECT S."IdSalida" AS "IdMovimiento", S."IdArticulo", A."NomArticulo", 'SALIDA' AS "TipoMovimiento", S."Cantidad", A."StockActual" AS "StockFinal", S."FechaMovimiento"
            FROM "Salidas" S
            JOIN "Articulos" A ON S."IdArticulo" = A."IdArticulo"
            WHERE S."BajaLogica" = TRUE
            ORDER BY "FechaMovimiento" DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener historial de movimientos:', error);
        res.status(500).json({ msg: 'Error interno al obtener historial de movimientos.' });
    } finally {
        client.release();
    }
};
const { query, pool } = require('../config/db'); 
// Uso de Socket.IO
const { getIO } = require('../socket');

// Función auxiliar para auditoría (obtener el IdUsuario que realiza el movimiento)
const getUserInfo = (req) => {
    // Si la ruta está protegida, req.user.id contendrá el IdUsuario. Si no, usamos 0.
    const ClaUserMod = req.user ? req.user.id : 0; 
    const NombrePcMod = 'WEB_APP_MOV';
    return { ClaUserMod, NombrePcMod };
};

// Función auxiliar de validación de número
const isNumeric = (val) => !isNaN(parseFloat(val)) && isFinite(val);

// ===============================================
// Lógica de ENTRADA (Añadir Stock)
// ===============================================
exports.entradaInsumo = async (req, res) => {
    const { IdArticulo, Cantidad, Comentarios } = req.body;
    const { ClaUserMod, NombrePcMod } = getUserInfo(req);
    const client = await pool.connect(); // Usar pool para la transacción

    // Validaciones iniciales
    if (!IdArticulo || !Cantidad || !isNumeric(Cantidad) || !isNumeric(IdArticulo)) {
        return res.status(400).json({ msg: 'Debe especificar el artículo y una cantidad numérica válida.' });
    }
    const cantidadNumerica = parseInt(Cantidad);
    if (cantidadNumerica <= 0) {
        return res.status(400).json({ msg: 'La cantidad de entrada debe ser mayor a cero.' });
    }

    try {
        await client.query('BEGIN'); // INICIAR TRANSACCIÓN

        // 1. Obtener Stock Actual y Cantidad Máxima del artículo
        const stockQuery = await client.query(
            `SELECT A."StockActual", CS."CantidadMaxima" 
             FROM "Articulos" AS A
             JOIN "CfgStock" AS CS ON A."IdCfgStock" = CS."IdCfgStock"
             WHERE A."IdArticulo" = $1 AND A."BajaLogica" = TRUE`,
            [IdArticulo]
        );

        if (stockQuery.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ msg: 'Artículo no encontrado o dado de baja.' });
        }

        const { StockActual, CantidadMaxima } = stockQuery.rows[0];
        const nuevoStock = StockActual + cantidadNumerica;

        // 2. Validación de Límite Máximo (Funcionalidad 4: No permitir exceso)
        if (nuevoStock > CantidadMaxima) {
            await client.query('ROLLBACK');
            const excedente = nuevoStock - CantidadMaxima;
            return res.status(400).json({ 
                msg: `Advertencia: La entrada excede la cantidad máxima de ${CantidadMaxima}. Se excede por ${excedente} unidad(es).`,
                alertType: 'warning' 
            });
        }

        // 3. Actualizar el Stock Actual en la tabla Articulos
        await client.query(
            `UPDATE "Articulos" SET "StockActual" = $1, "FechaUltMod" = NOW(), "ClaUserMod" = $2, "NombrePcMod" = $3 
             WHERE "IdArticulo" = $4`,
            [nuevoStock, ClaUserMod, NombrePcMod, IdArticulo]
        );

        // 4. Registrar la Entrada en la tabla Entradas
        await client.query(
            `INSERT INTO "Entradas" ("IdArticulo", "Cantidad", "Comentarios", "FechaMovimiento", "FechaUltMod", "ClaUserMod", "NombrePcMod", "BajaLogica") 
            VALUES ($1, $2, $3, NOW(), NOW(), $4, $5, TRUE)`,
            [IdArticulo, cantidadNumerica, Comentarios, ClaUserMod, NombrePcMod]
        );

       await client.query('COMMIT'); // CONFIRMAR TRANSACCIÓN

        // 5. Notificación en Tiempo Real
        getIO().emit('stockUpdate', { 
            id: IdArticulo, 
            newStock: nuevoStock,
            message: `El stock del artículo ${IdArticulo} ha sido actualizado a ${nuevoStock}.`
        });

        res.json({ msg: 'Entrada registrada exitosamente.', nuevoStock });

    } catch (error) {
        await client.query('ROLLBACK'); // REVERTIR SI HAY ERROR
        console.error('Error en entrada de insumo (ROLLBACK):', error);
        res.status(500).json({ msg: 'Error interno del servidor al registrar entrada.' });
    } finally {
        client.release(); // Liberar el cliente
    }
};

// ===============================================
// Lógica de SALIDA (Restar Stock)
// ===============================================
exports.salidaInsumo = async (req, res) => {
    const { IdArticulo, Cantidad, Comentarios } = req.body;
    const { ClaUserMod, NombrePcMod } = getUserInfo(req);
    const client = await pool.connect();

    // Validaciones iniciales
    if (!IdArticulo || !Cantidad || !isNumeric(Cantidad) || !isNumeric(IdArticulo)) {
        return res.status(400).json({ msg: 'Debe especificar el artículo y una cantidad numérica válida.' });
    }
    const cantidadNumerica = parseInt(Cantidad);
    if (cantidadNumerica <= 0) {
        return res.status(400).json({ msg: 'La cantidad de salida debe ser mayor a cero.' });
    }

    try {
        await client.query('BEGIN');

        // 1. Obtener Stock Actual y Cantidad Mínima del artículo
        const stockQuery = await client.query(
            `SELECT A."StockActual", CS."CantidadMinima" 
             FROM "Articulos" AS A
             JOIN "CfgStock" AS CS ON A."IdCfgStock" = CS."IdCfgStock"
             WHERE A."IdArticulo" = $1 AND A."BajaLogica" = TRUE`,
            [IdArticulo]
        );

        if (stockQuery.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ msg: 'Artículo no encontrado o dado de baja.' });
        }

        const { StockActual, CantidadMinima } = stockQuery.rows[0];
        const nuevoStock = StockActual - cantidadNumerica;

        // 2. Validación de Stock Insuficiente (No permitir stock negativo)
        if (nuevoStock < 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                msg: `No se puede realizar la salida. Stock actual insuficiente: ${StockActual} unidad(es).`,
                alertType: 'error' 
            });
        }
        
        // 3. Validación de Alerta de Límite Mínimo (Cuando el stock queda EN o por debajo del mínimo)
        let stockAlert = null;
        if (nuevoStock <= CantidadMinima) {
            // Esto es una advertencia, NO detiene la transacción
            stockAlert = `ATENCIÓN: La salida deja el stock en ${nuevoStock}, alcanzando el límite mínimo de ${CantidadMinima}.`;
        }


        // 4. Actualizar el Stock Actual
        await client.query(
            `UPDATE "Articulos" SET "StockActual" = $1, "FechaUltMod" = NOW(), "ClaUserMod" = $2, "NombrePcMod" = $3 
             WHERE "IdArticulo" = $4`,
            [nuevoStock, ClaUserMod, NombrePcMod, IdArticulo]
        );

        // 5. Registrar la Salida en la tabla Salidas
        await client.query(
            `INSERT INTO "Salidas" ("IdArticulo", "Cantidad", "Comentarios", "FechaMovimiento", "FechaUltMod", "ClaUserMod", "NombrePcMod", "BajaLogica") 
            VALUES ($1, $2, $3, NOW(), NOW(), $4, $5, TRUE)`,
            [IdArticulo, cantidadNumerica, Comentarios, ClaUserMod, NombrePcMod]
        );

        await client.query('COMMIT');

    // Notificación en Tiempo Real
    getIO().emit('stockUpdate', { message: `Stock de artículo ${IdArticulo} actualizado.` });
        
        // Devolver el mensaje de alerta si existe (Funcionalidad 4)
        const response = { 
            msg: 'Salida registrada exitosamente.', 
            nuevoStock, 
            alert: stockAlert 
        };
        res.json(response);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en salida de insumo (ROLLBACK):', error);
        res.status(500).json({ msg: 'Error interno del servidor al registrar salida.' });
    } finally {
        client.release();
    }
};