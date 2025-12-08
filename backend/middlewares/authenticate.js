// middleware/authenticate.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    console.log('[auth middleware] Authorization header:', authHeader?.substring(0, 30) + '...');
    
    if (!authHeader) {
        console.log('[auth middleware] No authorization header');
        return res.status(401).json({ error: "No autorizado" });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
        console.log('[auth middleware] Invalid format');
        return res.status(401).json({ error: "Formato inválido" });
    }

    const token = parts[1];
    jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
        if (err) {
            console.log('[auth middleware] Token verification failed:', err.message);
            // Retornar 401 para que el frontend intente renovar
            return res.status(401).json({ error: "Token inválido o expirado", code: err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN' });
        }
        console.log('[auth middleware] Token valid for user:', decoded.id);
        req.user = { id: decoded.id, email: decoded.email };
        next();
    });
};
