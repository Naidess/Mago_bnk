// controllers/magysController.js
const pool = require("../db");

exports.getSaldo = async (req, res) => {
    try {
        const result = await pool.query("SELECT saldo FROM magys WHERE usuario_id = $1", [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Cuenta Magys no encontrada" });
        res.json({ saldo: result.rows[0].saldo });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al obtener saldo" });
    }
};

exports.sumarMagys = async (req, res) => {
    const { cantidad } = req.body;
    if (typeof cantidad !== "number" || cantidad <= 0) return res.status(400).json({ error: "Cantidad inválida" });
    try {
        await pool.query("UPDATE magys SET saldo = saldo + $1, updated_at = now() WHERE usuario_id = $2", [cantidad, req.user.id]);
        const updated = await pool.query("SELECT saldo FROM magys WHERE usuario_id = $1", [req.user.id]);
        res.json({ message: "Magys sumados", saldo: updated.rows[0].saldo });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al sumar Magys" });
    }
};

exports.canjearMagys = async (req, res) => {
    const { cantidad } = req.body;
    if (typeof cantidad !== "number" || cantidad <= 0) return res.status(400).json({ error: "Cantidad inválida" });
    try {
        const current = await pool.query("SELECT saldo FROM magys WHERE usuario_id = $1", [req.user.id]);
        if (current.rows.length === 0) return res.status(404).json({ error: "Cuenta Magys no encontrada" });
        const saldo = current.rows[0].saldo;
        if (saldo < cantidad) return res.status(400).json({ error: "Saldo insuficiente" });

        await pool.query("UPDATE magys SET saldo = saldo - $1, updated_at = now() WHERE usuario_id = $2", [cantidad, req.user.id]);
        const updated = await pool.query("SELECT saldo FROM magys WHERE usuario_id = $1", [req.user.id]);
        res.json({ message: "Magys canjeados", saldo: updated.rows[0].saldo });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al canjear Magys" });
    }
};