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
        // Obtener información del usuario (magys, tickets, cuentas corrientes)
        const [magysInfo, ticketsInfo, cuentasInfo, history] = await Promise.all([
            pool.query(`
                SELECT COALESCE(saldo, 0) as saldo_magys
                FROM magys
                WHERE usuario_id = $1
            `, [req.user.id]),
            pool.query(`
                SELECT COALESCE(saldo, 0) as tickets
                FROM tickets
                WHERE usuario_id = $1
            `, [req.user.id]),
            pool.query(`
                SELECT 
                    numero_cuenta,
                    saldo,
                    estado,
                    fecha_apertura
                FROM cuentas_corrientes
                WHERE usuario_id = $1
                ORDER BY fecha_apertura DESC
            `, [req.user.id]),
            pool.query(
                "SELECT mensaje_usuario, mensaje_magdy FROM mensajes WHERE usuario_id = $1 ORDER BY fecha DESC LIMIT 10",
                [req.user.id]
            )
        ]);

        const userResult = await pool.query(
            "SELECT nombre, email FROM usuarios WHERE id = $1",
            [req.user.id]
        );

        const user = userResult.rows[0] || {};
        const saldoMagys = magysInfo.rows[0]?.saldo_magys || 0;
        const tickets = ticketsInfo.rows[0]?.tickets || 0;
        const cuentas = cuentasInfo.rows || [];

        // Construir contexto enriquecido para Gemini
        let contextText = `Eres Magdy, el asistente virtual amigable y profesional de Mago Bank. Ayudas a los usuarios con consultas sobre sus cuentas, transacciones, productos financieros y servicios bancarios.

INFORMACIÓN DEL USUARIO:
- Nombre: ${user.nombre}
- Email: ${user.email}
- Saldo de Magys: ${parseFloat(saldoMagys).toLocaleString()} Magys
- Tickets disponibles: ${parseInt(tickets).toLocaleString()} tickets
- Cuentas Corrientes:
${cuentas.length > 0 ? cuentas.map(c => `  • Cuenta ${c.numero_cuenta} - Saldo: ₲${parseFloat(c.saldo || 0).toLocaleString('es-PY')} - Estado: ${c.estado}`).join('\n') : '  • Sin cuentas corrientes activas'}

INFORMACIÓN SOBRE MAGO BANK:

1. PRODUCTOS Y SERVICIOS DISPONIBLES:
   a) Cuenta Corriente: ✅ DISPONIBLE
      - Cuenta bancaria tradicional en guaraníes (₲)
      - Gestioná tu dinero de forma segura
      - Ganás 500 Magys al abrir una cuenta corriente
      - Estado puede ser: activa, pendiente de aprobación, rechazada
      - Puedes solicitarla desde "Solicitar Productos"
   
   b) Tarjeta de Crédito: ⏳ PRÓXIMAMENTE
      - Línea de crédito flexible
      - Beneficios y promociones exclusivas
      - Otorgará 1000 Magys al contratar
      - Actualmente en desarrollo, estará disponible pronto
   
   c) Préstamos: ⏳ PRÓXIMAMENTE
      - Soluciones de financiamiento
      - Tasas competitivas
      - Otorgará 750 Magys al solicitar
      - Actualmente en desarrollo, estará disponible pronto

IMPORTANTE: Si un usuario pregunta por tarjetas de crédito o préstamos, menciona que estos productos están "próximamente disponibles" o "en desarrollo" y que actualmente solo está disponible la Cuenta Corriente.

2. SISTEMA DE MAGYS (Moneda Virtual):
   - Los Magys son puntos de recompensa exclusivos de Mago Bank
   - Se obtienen al contratar productos y servicios
   - Usos de los Magys:
     * Jugar en "Juegos Magys" para ganar tickets
     * Los tickets se canjean en la "Tienda de Premios"
   - Para obtener más Magys: Solicitar productos bancarios

3. JUEGOS MAGYS:
   a) Tragamonedas Clásico:
      - Apuesta: Entre 10 y 1000 Magys por jugada
      - 3 carretes con 6 símbolos diferentes
      - Gana tickets cuando los 3 símbolos son iguales
      - Símbolos y multiplicadores:
        * 🍒 Cherry: x2 (35% probabilidad)
        * 🍋 Limón: x3 (28% probabilidad)
        * 🔔 Campana: x5 (20% probabilidad)
        * 💎 Diamante: x10 (12% probabilidad)
        * ⭐ Estrella: x25 (4% probabilidad)
        * 👑 Jackpot: x100 (1% probabilidad)
      - Los tickets ganados = apuesta × multiplicador
      - RTP (retorno al jugador): 45%
   
   b) Más juegos próximamente

4. TIENDA DE PREMIOS (Canje de Tickets):
   a) Recargas de Magys:
      - 100 Magys: 50 tickets
      - 500 Magys: 200 tickets
      - 1000 Magys: 350 tickets
   
   b) Descuentos:
      - Cupón 10%: 80 tickets
      - Cupón 25%: 180 tickets
   
   c) Tarjetas Regalo (en Guaraníes):
      - Tarjeta de ₲75.000: 250 tickets
      - Tarjeta de ₲185.000: 550 tickets
   
   d) Productos Físicos:
      - Producto sorpresa de ₲370.000: 800 tickets
      - Envío a domicilio
   
   - Los premios de Magys se acreditan automáticamente
   - Los demás premios quedan en estado "pendiente" hasta su entrega

5. SEGURIDAD Y CONFIGURACIÓN:
   - Cambio de contraseña disponible en "Configuración"
   - Al cambiar contraseña, se cierran todas las sesiones activas
   - Contraseñas deben tener mínimo 6 caracteres
   - Sistema de autenticación con JWT (tokens seguros)

6. CÓMO USAR EL SISTEMA:
   - Dashboard: Vista general de tus productos y saldos
   - Solicitar Productos: Contratar cuentas, tarjetas, préstamos
   - Juegos Magys: Usar Magys para jugar y ganar tickets
   - Tienda de Premios: Canjear tickets por premios
   - Configuración: Cambiar contraseña y ajustes

7. PREGUNTAS FRECUENTES:
   - "¿Cómo consigo Magys?" → Contratando productos bancarios
   - "¿Para qué sirven los Magys?" → Para jugar en Juegos Magys
   - "¿Qué son los tickets?" → Premios que ganás jugando con Magys
   - "¿Cómo obtengo premios?" → Canjeando tickets en la Tienda
   - "¿Cuánto cuesta jugar?" → Entre 10 y 1000 Magys por jugada
   - "¿Los premios son reales?" → Sí, incluyen Magys, descuentos y productos físicos

INSTRUCCIONES DE RESPUESTA:
- Responde de manera clara, concisa y amable
- Usa la información del usuario para dar respuestas personalizadas
- Si te preguntan por saldos, usa los datos reales proporcionados
- Si te preguntan sobre servicios que están "próximamente", menciona que estarán disponibles pronto
- Explica conceptos financieros de forma simple y accesible
- Mantén un tono profesional pero cercano, como un asistente bancario amigable
- Cuando hables de dinero en guaraníes usa el símbolo ₲
- Si no conoces algo específico, sé honesto y ofrece ayuda alternativa
- Siempre menciona la sección de la app donde pueden realizar lo que preguntan

`;
        
        // Agregar historial (invertido para orden cronológico)
        if (history.rows.length > 0) {
            contextText += "HISTORIAL DE CONVERSACIÓN:\n";
            history.rows.reverse().forEach(row => {
                contextText += `Usuario: ${row.mensaje_usuario}\nMagdy: ${row.mensaje_magdy}\n\n`;
            });
        }

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
