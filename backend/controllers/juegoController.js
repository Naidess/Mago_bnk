// controllers/juegoController.js
const pool = require("../db");

/**
 * Obtener lista de juegos disponibles
 */
exports.listarJuegos = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id,
                nombre,
                descripcion,
                costo_minimo,
                costo_maximo,
                tipo,
                rtp,
                activo,
                configuracion
            FROM juegos
            WHERE activo = true
            ORDER BY id
        `);

        res.json({ juegos: result.rows });
    } catch (error) {
        console.error("Error al listar juegos:", error);
        res.status(500).json({ error: "Error al obtener juegos" });
    }
};

/**
 * Obtener símbolos del tragamonedas
 */
exports.obtenerSimbolos = async (req, res) => {
    try {
        const { juegoId } = req.params;

        const result = await pool.query(`
            SELECT simbolo, nombre, probabilidad, multiplicador
            FROM slot_simbolos
            WHERE juego_id = $1
            ORDER BY orden
        `, [juegoId]);

        res.json({ simbolos: result.rows });
    } catch (error) {
        console.error("Error al obtener símbolos:", error);
        res.status(500).json({ error: "Error al obtener símbolos" });
    }
};

/**
 * JUGAR TRAGAMONEDAS
 * Lógica principal del juego
 */
exports.jugarSlots = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const usuarioId = req.user.id;
        const { apuesta, juegoId = 1 } = req.body;

        // Validar apuesta
        if (!apuesta || apuesta < 10) {
            return res.status(400).json({ error: "Apuesta mínima: 10 Magys" });
        }

        await client.query('BEGIN');

        // Verificar saldo de Magys
        const magysResult = await client.query(
            "SELECT saldo FROM magys WHERE usuario_id = $1 FOR UPDATE",
            [usuarioId]
        );

        if (magysResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Usuario no tiene cuenta de Magys" });
        }

        const saldoMagys = magysResult.rows[0].saldo;

        if (saldoMagys < apuesta) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                error: "Saldo insuficiente de Magys",
                saldo: saldoMagys,
                necesario: apuesta
            });
        }

        // Obtener configuración del juego y símbolos
        const juegoResult = await client.query(
            "SELECT nombre, costo_minimo, costo_maximo FROM juegos WHERE id = $1 AND activo = true",
            [juegoId]
        );

        if (juegoResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Juego no encontrado" });
        }

        const juego = juegoResult.rows[0];

        // Validar límites de apuesta
        if (apuesta < juego.costo_minimo || (juego.costo_maximo && apuesta > juego.costo_maximo)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                error: `Apuesta debe estar entre ${juego.costo_minimo} y ${juego.costo_maximo} Magys` 
            });
        }

        // Obtener símbolos y probabilidades
        const simbolosResult = await client.query(`
            SELECT simbolo, nombre, probabilidad, multiplicador
            FROM slot_simbolos
            WHERE juego_id = $1
            ORDER BY orden
        `, [juegoId]);

        const simbolos = simbolosResult.rows;

        // ==========================================
        // LÓGICA DEL TRAGAMONEDAS
        // ==========================================

        // Generar 3 carretes con probabilidades ponderadas
        const carretes = [];
        for (let i = 0; i < 3; i++) {
            carretes.push(girarCarrete(simbolos));
        }

        // Verificar si ganó
        const primerSimbolo = carretes[0];
        const gano = carretes.every(c => c.simbolo === primerSimbolo.simbolo);

        let ticketsGanados = 0;
        let multiplicador = 0;

        if (gano) {
            multiplicador = primerSimbolo.multiplicador;
            ticketsGanados = apuesta * multiplicador;
        }

        // Actualizar saldo de Magys (descontar apuesta)
        await client.query(
            "UPDATE magys SET saldo = saldo - $1 WHERE usuario_id = $2",
            [apuesta, usuarioId]
        );

        // Crear o actualizar tickets del usuario
        if (ticketsGanados > 0) {
            await client.query(`
                INSERT INTO tickets (usuario_id, saldo, total_ganado)
                VALUES ($1, $2, $2)
                ON CONFLICT (usuario_id) DO UPDATE
                SET 
                    saldo = tickets.saldo + $2,
                    total_ganado = tickets.total_ganado + $2
            `, [usuarioId, ticketsGanados]);
        } else {
            // Asegurar que el usuario tenga registro de tickets (aunque sea 0)
            await client.query(`
                INSERT INTO tickets (usuario_id, saldo, total_ganado)
                VALUES ($1, 0, 0)
                ON CONFLICT (usuario_id) DO NOTHING
            `, [usuarioId]);
        }

        // Registrar jugada en historial
        const resultado = {
            carretes: carretes.map(c => ({ simbolo: c.simbolo, nombre: c.nombre })),
            gano,
            multiplicador,
            simbolo_ganador: gano ? primerSimbolo.nombre : null
        };

        await client.query(`
            INSERT INTO juegos_historial 
            (usuario_id, juego_id, apuesta, resultado, ganancia, magys_gastados, ip)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
            usuarioId,
            juegoId,
            apuesta,
            JSON.stringify(resultado),
            ticketsGanados,
            apuesta,
            req.ip
        ]);

        // Registrar en historial de Magys (gasto)
        await client.query(`
            INSERT INTO magys_historial 
            (usuario_id, tipo_evento, cantidad, descripcion)
            VALUES ($1, 'juego_casino', $2, $3)
        `, [
            usuarioId,
            -apuesta,
            `Jugó ${juego.nombre} - Apuesta: ${apuesta} Magys`
        ]);

        await client.query('COMMIT');

        // Obtener saldos actualizados
        const saldosResult = await client.query(`
            SELECT 
                m.saldo as magys,
                COALESCE(t.saldo, 0) as tickets
            FROM magys m
            LEFT JOIN tickets t ON t.usuario_id = m.usuario_id
            WHERE m.usuario_id = $1
        `, [usuarioId]);

        const saldos = saldosResult.rows[0];

        res.json({
            resultado: {
                carretes: carretes.map(c => c.simbolo),
                nombres: carretes.map(c => c.nombre),
                gano,
                multiplicador,
                ticketsGanados,
                mensajeGanancia: gano 
                    ? `¡GANASTE! ${ticketsGanados} tickets (${multiplicador}x)` 
                    : "Sigue intentando..."
            },
            saldos: {
                magys: parseInt(saldos.magys),
                tickets: parseInt(saldos.tickets)
            },
            apuesta
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error al jugar slots:", error);
        res.status(500).json({ error: "Error al procesar jugada" });
    } finally {
        client.release();
    }
};

/**
 * Función auxiliar: Girar carrete con probabilidades ponderadas
 */
function girarCarrete(simbolos) {
    // Crear array ponderado por probabilidades
    const total = simbolos.reduce((sum, s) => sum + parseFloat(s.probabilidad), 0);
    const random = Math.random() * total;
    
    let acumulado = 0;
    for (const simbolo of simbolos) {
        acumulado += parseFloat(simbolo.probabilidad);
        if (random <= acumulado) {
            return simbolo;
        }
    }
    
    // Fallback (no debería llegar aquí)
    return simbolos[0];
}

/**
 * Obtener saldo de tickets del usuario
 */
exports.obtenerTickets = async (req, res) => {
    try {
        const usuarioId = req.user.id;

        const result = await pool.query(`
            SELECT 
                COALESCE(saldo, 0) as saldo,
                COALESCE(total_ganado, 0) as total_ganado,
                COALESCE(total_canjeado, 0) as total_canjeado
            FROM tickets
            WHERE usuario_id = $1
        `, [usuarioId]);

        if (result.rows.length === 0) {
            // Usuario no tiene tickets aún, crear registro
            await pool.query(
                "INSERT INTO tickets (usuario_id, saldo) VALUES ($1, 0)",
                [usuarioId]
            );
            return res.json({ saldo: 0, total_ganado: 0, total_canjeado: 0 });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error al obtener tickets:", error);
        res.status(500).json({ error: "Error al obtener tickets" });
    }
};

/**
 * Obtener historial de jugadas del usuario
 */
exports.obtenerHistorial = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const { limite = 20 } = req.query;

        const result = await pool.query(`
            SELECT 
                jh.id,
                j.nombre as juego,
                jh.apuesta,
                jh.ganancia,
                jh.resultado,
                jh.fecha_jugado
            FROM juegos_historial jh
            INNER JOIN juegos j ON j.id = jh.juego_id
            WHERE jh.usuario_id = $1
            ORDER BY jh.fecha_jugado DESC
            LIMIT $2
        `, [usuarioId, limite]);

        res.json({ historial: result.rows });
    } catch (error) {
        console.error("Error al obtener historial:", error);
        res.status(500).json({ error: "Error al obtener historial" });
    }
};
