// controllers/chatController.js
const pool = require("../db");
const axios = require("axios");

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:4000/procesar";

exports.responder = async (req, res) => {
    const { mensaje } = req.body;
    if (!mensaje || typeof mensaje !== "string") return res.status(400).json({ error: "Mensaje requerido" });

    try {
        // Llamada al microservicio IA
        const aiResp = await axios.post(AI_URL, { mensaje });
        const respuesta = (aiResp.data && aiResp.data.respuesta) ? aiResp.data.respuesta : "Lo siento, no pude procesar tu mensaje";

        // Guardar en DB
        await pool.query(
            "INSERT INTO mensajes (usuario_id, mensaje_usuario, mensaje_magdy) VALUES ($1, $2, $3)",
            [req.user.id, mensaje, respuesta]
        );

        res.json({ respuesta });
    } catch (err) {
        console.error("Error chatController:", err.message || err);
        res.status(500).json({ error: "Error al procesar IA" });
    }
};
