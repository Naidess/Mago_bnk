// controllers/premioController.js
const pool = require("../db");

/**
 * Listar premios disponibles
 */
exports.listarPremios = async (req, res) => {
    try {
        const { categoria } = req.query;

        let query = `
            SELECT 
                id,
                nombre,
                descripcion,
                imagen_url,
                costo_tickets,
                stock,
                categoria,
                valor_real
            FROM premios
            WHERE activo = true
        `;

        const params = [];

        if (categoria) {
            query += ` AND categoria = $1`;
            params.push(categoria);
        }

        query += ` ORDER BY costo_tickets ASC`;

        const result = await pool.query(query, params);

        res.json({ premios: result.rows });
    } catch (error) {
        console.error("Error al listar premios:", error);
        res.status(500).json({ error: "Error al obtener premios" });
    }
};

/**
 * Canjear premio con tickets
 */
exports.canjearPremio = async (req, res) => {
    const client = await pool.connect();

    try {
        const usuarioId = req.user.id;
        const { premioId, direccionEnvio } = req.body;

        if (!premioId) {
            return res.status(400).json({ error: "ID de premio requerido" });
        }

        await client.query('BEGIN');

        // Obtener premio
        const premioResult = await client.query(`
            SELECT 
                id,
                nombre,
                costo_tickets,
                stock,
                activo,
                categoria
            FROM premios
            WHERE id = $1
            FOR UPDATE
        `, [premioId]);

        if (premioResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Premio no encontrado" });
        }

        const premio = premioResult.rows[0];

        if (!premio.activo) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Premio no disponible" });
        }

        // Verificar stock
        if (premio.stock !== null && premio.stock <= 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Premio agotado" });
        }

        // Obtener saldo de tickets del usuario
        const ticketsResult = await client.query(
            "SELECT saldo FROM tickets WHERE usuario_id = $1 FOR UPDATE",
            [usuarioId]
        );

        if (ticketsResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "No tienes tickets" });
        }

        const saldoTickets = parseInt(ticketsResult.rows[0].saldo);

        if (saldoTickets < premio.costo_tickets) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: "Tickets insuficientes",
                saldo: saldoTickets,
                necesario: premio.costo_tickets
            });
        }

        // Descontar tickets
        await client.query(`
            UPDATE tickets
            SET 
                saldo = saldo - $1,
                total_canjeado = total_canjeado + $1
            WHERE usuario_id = $2
        `, [premio.costo_tickets, usuarioId]);

        // Registrar canje
        const canjeResult = await client.query(`
            INSERT INTO canjes 
            (usuario_id, premio_id, tickets_gastados, estado, direccion_envio)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `, [
            usuarioId,
            premioId,
            premio.costo_tickets,
            'pendiente',
            direccionEnvio || null
        ]);

        const canjeId = canjeResult.rows[0].id;

        // Si es premio de Magys, acreditar inmediatamente
        if (premio.categoria === 'magys') {
            const magysMatch = premio.nombre.match(/(\d+)\s*Magys/i);
            if (magysMatch) {
                const cantidadMagys = parseInt(magysMatch[1]);

                // Acreditar Magys
                await client.query(
                    "UPDATE magys SET saldo = saldo + $1 WHERE usuario_id = $2",
                    [cantidadMagys, usuarioId]
                );

                // Registrar en historial
                await client.query(`
                    INSERT INTO magys_historial 
                    (usuario_id, tipo_evento, cantidad, descripcion)
                    VALUES ($1, 'canje_premio', $2, $3)
                `, [
                    usuarioId,
                    cantidadMagys,
                    `Canjeó premio: ${premio.nombre}`
                ]);

                // Actualizar estado del canje a entregado
                await client.query(
                    "UPDATE canjes SET estado = 'entregado', fecha_entrega = NOW() WHERE id = $1",
                    [canjeId]
                );
            }
        }

        // Reducir stock si aplica
        if (premio.stock !== null) {
            await client.query(
                "UPDATE premios SET stock = stock - 1 WHERE id = $1",
                [premioId]
            );
        }

        await client.query('COMMIT');

        // Obtener saldo actualizado de tickets
        const saldoActualizadoResult = await client.query(
            "SELECT saldo FROM tickets WHERE usuario_id = $1",
            [usuarioId]
        );

        res.json({
            message: "Premio canjeado exitosamente",
            canje: {
                id: canjeId,
                premio: premio.nombre,
                tickets_gastados: premio.costo_tickets,
                estado: premio.categoria === 'magys' ? 'entregado' : 'pendiente'
            },
            saldo_tickets: parseInt(saldoActualizadoResult.rows[0].saldo)
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error al canjear premio:", error);
        res.status(500).json({ error: "Error al procesar canje" });
    } finally {
        client.release();
    }
};

/**
 * Obtener historial de canjes del usuario
 */
exports.obtenerCanjes = async (req, res) => {
    try {
        const usuarioId = req.user.id;

        const result = await pool.query(`
            SELECT 
                c.id,
                p.nombre as premio,
                c.tickets_gastados,
                c.estado,
                c.fecha_canje,
                c.fecha_entrega,
                c.codigo_seguimiento
            FROM canjes c
            INNER JOIN premios p ON p.id = c.premio_id
            WHERE c.usuario_id = $1
            ORDER BY c.fecha_canje DESC
        `, [usuarioId]);

        res.json({ canjes: result.rows });
    } catch (error) {
        console.error("Error al obtener canjes:", error);
        res.status(500).json({ error: "Error al obtener historial de canjes" });
    }
};

/**
 * Obtener estadísticas del usuario (admin view)
 */
exports.obtenerEstadisticas = async (req, res) => {
    try {
        const usuarioId = req.user.id;

        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_jugadas,
                SUM(apuesta) as total_magys_gastados,
                SUM(ganancia) as total_tickets_ganados,
                (SELECT COUNT(*) FROM canjes WHERE usuario_id = $1) as total_canjes
            FROM juegos_historial
            WHERE usuario_id = $1
        `, [usuarioId]);

        res.json({ estadisticas: result.rows[0] });
    } catch (error) {
        console.error("Error al obtener estadísticas:", error);
        res.status(500).json({ error: "Error al obtener estadísticas" });
    }
};
