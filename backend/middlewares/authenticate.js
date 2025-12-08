// middleware/authenticate.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    if (!authHeader) return res.status(401).json({ error: "No autorizado" });

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") return res.status(401).json({ error: "Formato inválido" });

    const token = parts[1];
    jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Token inválido o expirado" });
        req.user = { id: decoded.id, email: decoded.email };
        next();
    });
};
