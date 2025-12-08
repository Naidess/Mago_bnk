// controllers/chatController.js
const pool = require("../db");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash" });

exports.sendMessage = async (req, res) => {
    const { message } = req.body;
    if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Mensaje requerido" });
    }

    console.log('[chat] Procesando mensaje:', message.substring(0, 50));
    console.log('[chat] Gemini API Key configured:', !!process.env.GEMINI_API_KEY);

    try {
        // Obtener historial reciente del usuario (últimos 10 mensajes)
        const history = await pool.query(
            "SELECT mensaje_usuario, mensaje_magdy FROM mensajes WHERE usuario_id = $1 ORDER BY fecha DESC LIMIT 10",
            [req.user.id]
        );

        // Construir contexto de conversación para Gemini
        let contextText = "Eres Magdy, el asistente virtual amigable y profesional de Mago Bank. Ayudas a los usuarios con consultas sobre sus cuentas, transacciones, productos financieros y servicios bancarios. Responde de manera clara, concisa y amable.\n\n";
        
        // Agregar historial (invertido para orden cronológico)
        history.rows.reverse().forEach(row => {
            contextText += `Usuario: ${row.mensaje_usuario}\nMagdy: ${row.mensaje_magdy}\n\n`;
        });

        contextText += `Usuario: ${message}\nMagdy:`;

        console.log('[chat] Llamando a Gemini API...');

        // Llamar a Gemini
        const result = await model.generateContent(contextText);
        const response = await result.response;
        const reply = response.text() || "Lo siento, no pude procesar tu mensaje.";

        console.log('[chat] Respuesta generada exitosamente');

        // Guardar en DB
        await pool.query(
            "INSERT INTO mensajes (usuario_id, mensaje_usuario, mensaje_magdy) VALUES ($1, $2, $3)",
            [req.user.id, message, reply]
        );

        res.json({ reply });
    } catch (err) {
        console.error("[chat] Error completo:", err);
        console.error("[chat] Error message:", err.message);
        console.error("[chat] Error status:", err.status);
        console.error("[chat] Error response:", err.response?.data);
        res.status(500).json({ error: "Error al procesar mensaje con IA" });
    }
};
