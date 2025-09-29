const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            // Verifica el token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Se adjunta la información del usuario decodificada al request
            // Se usa para los campos de control (ClaUserMod)
            req.user = decoded; 

            next();
        } catch (error) {
            console.error('Error de token:', error);
            // Error 401 si el token es inválido/expirado
            res.status(401).json({ msg: 'No autorizado, token fallido o expirado.' });
        }
    }

    if (!token) {
        // Error 401 si no se envía el token
        res.status(401).json({ msg: 'No autorizado, no se encontró token.' });
    }
};

module.exports = { protect };