const { query } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Función para registrar un nuevo usuario (para pruebas iniciales)
exports.registerUser = async (req, res) => {
    const { nombre, email, password } = req.body;
    
    // Valores predeterminados para control y auditoría
    const ClaUserMod = 1; // ID del usuario que crea (1 = Admin inicial)
    const NombrePcMod = 'SERVIDOR_REG';
    const BajaLogica = true;

    // **Validaciones 1: Campos Requeridos**
    if (!nombre || !email || !password) {
        return res.status(400).json({ msg: 'Todos los campos (nombre, email, password) son obligatorios.' });
    }
    
    // **Validaciones 2: Longitud mínima**
    if (password.length < 6) {
        return res.status(400).json({ msg: 'La contraseña debe tener al menos 6 caracteres.' });
    }
    
    // **Validaciones 3: Formato de Email Básico**
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ msg: 'El formato del email no es válido.' });
    }

    try {
        // 1. Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 2. Insertar en la BD, incluyendo los campos de control
        const result = await query(
            `INSERT INTO "Usuario" (
                "Nombre", "Email", "PasswordHash", "Rol", "FechaUltMod", 
                "ClaUserMod", "NombrePcMod", "BajaLogica"
            ) 
            VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7) 
            RETURNING *`,
            [nombre, email, passwordHash, 'ADMIN', ClaUserMod, NombrePcMod, BajaLogica]
        );

        res.status(201).json({ msg: 'Usuario registrado exitosamente', user: result.rows[0] });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        if (error.code === '23505') { 
             return res.status(400).json({ msg: 'El email ya está registrado.' });
        }
        res.status(500).json({ msg: 'Error interno del servidor.' });
    }
};

// Función principal de LOGIN (Funcionalidad 1)
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    // **Validaciones 1: Campos Requeridos**
    if (!email || !password) {
        return res.status(400).json({ msg: 'Ingrese email y contraseña.' });
    }

    try {
        // 1. Buscar usuario activo por email
        const result = await query(
            'SELECT * FROM "Usuario" WHERE "Email" = $1 AND "BajaLogica" = TRUE', 
            [email]
        );
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ msg: 'Credenciales inválidas.' });
        }

        // 2. Comparar la contraseña
        const isMatch = await bcrypt.compare(password, user.PasswordHash); // Usar el campo exacto

        if (!isMatch) {
            return res.status(401).json({ msg: 'Credenciales inválidas.' });
        }

        // 3. Generar el JWT
        const payload = {
            id: user.IdUsuario, 
            rol: user.Rol,
            email: user.Email
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 4. Enviar el token
        res.json({
            token,
            user: {
                id: user.IdUsuario,
                nombre: user.Nombre,
                email: user.Email,
                rol: user.Rol
            }
        });

    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ msg: 'Error interno del servidor.' });
    }
};