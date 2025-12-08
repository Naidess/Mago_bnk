// controllers/cuentaCorrienteController.js
const pool = require("../db");

// Generar número de cuenta único
function generarNumeroCuenta() {
    return 'CC' + Date.now() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
}

// Otorgar Magys por activación de producto
async function otorgarMagysPorProducto(usuarioId, tipoProducto, productoId, client) {
    try {
        // Obtener la regla de Magys para este producto
        const reglaResult = await client.query(
            "SELECT magys_por_activacion, descripcion FROM magys_reglas WHERE tipo_producto = $1 AND activo = TRUE",
            [tipoProducto]
        );

        if (reglaResult.rows.length === 0) {
            console.log(`No hay regla de Magys configurada para ${tipoProducto}`);
            return 0;
        }

        const { magys_por_activacion, descripcion } = reglaResult.rows[0];

        // Sumar Magys al usuario
        await client.query(
            "UPDATE magys SET saldo = saldo + $1, updated_at = NOW() WHERE usuario_id = $2",
            [magys_por_activacion, usuarioId]
        );

        // Registrar en historial
        await client.query(
            `INSERT INTO magys_historial (usuario_id, tipo_evento, producto_id, producto_tipo, cantidad, descripcion) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [usuarioId, 'activacion_producto', productoId, tipoProducto, magys_por_activacion, descripcion]
        );

        return magys_por_activacion;
    } catch (error) {
        console.error("Error al otorgar Magys:", error);
        throw error;
    }
}

// Solicitar cuenta corriente
exports.solicitarCuentaCorriente = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const usuarioId = req.user.id;

        // Verificar si el usuario ya tiene una cuenta corriente (cualquier estado excepto rechazada)
        const existente = await client.query(
            "SELECT id, estado FROM cuentas_corrientes WHERE usuario_id = $1 AND estado IN ('pendiente', 'aprobada')",
            [usuarioId]
        );

        if (existente.rows.length > 0) {
            await client.query('ROLLBACK');
            const estado = existente.rows[0].estado;
            if (estado === 'pendiente') {
                return res.status(400).json({ error: "Ya tienes una solicitud de cuenta corriente pendiente de aprobación" });
            }
            return res.status(400).json({ error: "Ya tienes una cuenta corriente aprobada" });
        }

        // Generar número de cuenta único
        let numeroCuenta;
        let intentos = 0;
        while (intentos < 5) {
            numeroCuenta = generarNumeroCuenta();
            const duplicado = await client.query(
                "SELECT id FROM cuentas_corrientes WHERE numero_cuenta = $1",
                [numeroCuenta]
            );
            if (duplicado.rows.length === 0) break;
            intentos++;
        }

        if (intentos === 5) {
            await client.query('ROLLBACK');
            return res.status(500).json({ error: "Error al generar número de cuenta único" });
        }

        // Crear cuenta corriente en estado PENDIENTE
        const nuevaCuenta = await client.query(
            `INSERT INTO cuentas_corrientes (usuario_id, numero_cuenta, saldo, estado, fecha_solicitud) 
             VALUES ($1, $2, $3, $4, NOW()) 
             RETURNING id, numero_cuenta, saldo, estado, fecha_solicitud`,
            [usuarioId, numeroCuenta, 0.00, 'pendiente']
        );

        const cuenta = nuevaCuenta.rows[0];

        // Crear registro en solicitudes_productos para tracking
        await client.query(
            `INSERT INTO solicitudes_productos (usuario_id, tipo_producto, producto_id, estado) 
             VALUES ($1, $2, $3, $4)`,
            [usuarioId, 'cuenta_corriente', cuenta.id, 'pendiente']
        );

        // NO otorgar Magys aún - solo cuando se apruebe
        await client.query('COMMIT');

        res.status(201).json({
            message: "Solicitud de cuenta corriente enviada exitosamente",
            cuenta: {
                id: cuenta.id,
                numeroCuenta: cuenta.numero_cuenta,
                saldo: parseFloat(cuenta.saldo),
                estado: cuenta.estado,
                fechaSolicitud: cuenta.fecha_solicitud
            },
            estado: "pendiente",
            info: "Tu solicitud está siendo evaluada. Te notificaremos cuando sea aprobada."
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error al solicitar cuenta corriente:", error);
        res.status(500).json({ error: "Error al procesar la solicitud" });
    } finally {
        client.release();
    }
};

// Obtener cuentas corrientes del usuario
exports.obtenerCuentasCorrientes = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, numero_cuenta, saldo, estado, fecha_apertura, fecha_actualizacion 
             FROM cuentas_corrientes 
             WHERE usuario_id = $1 
             ORDER BY fecha_apertura DESC`,
            [req.user.id]
        );

        const cuentas = result.rows.map(c => ({
            id: c.id,
            numeroCuenta: c.numero_cuenta,
            saldo: parseFloat(c.saldo),
            estado: c.estado,
            fechaApertura: c.fecha_apertura,
            fechaActualizacion: c.fecha_actualizacion
        }));

        res.json({ cuentas });
    } catch (error) {
        console.error("Error al obtener cuentas corrientes:", error);
        res.status(500).json({ error: "Error al obtener cuentas" });
    }
};

// Obtener detalle de una cuenta corriente
exports.obtenerDetalleCuenta = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            `SELECT id, numero_cuenta, saldo, estado, fecha_apertura, fecha_actualizacion 
             FROM cuentas_corrientes 
             WHERE id = $1 AND usuario_id = $2`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Cuenta no encontrada" });
        }

        const cuenta = result.rows[0];
        res.json({
            id: cuenta.id,
            numeroCuenta: cuenta.numero_cuenta,
            saldo: parseFloat(cuenta.saldo),
            estado: cuenta.estado,
            fechaApertura: cuenta.fecha_apertura,
            fechaActualizacion: cuenta.fecha_actualizacion
        });
    } catch (error) {
        console.error("Error al obtener detalle de cuenta:", error);
        res.status(500).json({ error: "Error al obtener detalle" });
    }
};

// Obtener historial de Magys del usuario
exports.obtenerHistorialMagys = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, tipo_evento, producto_tipo, cantidad, descripcion, fecha 
             FROM magys_historial 
             WHERE usuario_id = $1 
             ORDER BY fecha DESC 
             LIMIT 50`,
            [req.user.id]
        );

        res.json({ historial: result.rows });
    } catch (error) {
        console.error("Error al obtener historial de Magys:", error);
        res.status(500).json({ error: "Error al obtener historial" });
    }
};

// Aprobar o rechazar solicitud de cuenta corriente (ADMIN)
exports.aprobarRechazarSolicitud = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const { id } = req.params;
        const { accion, motivo, notas } = req.body; // accion: 'aprobar' o 'rechazar'

        if (!['aprobar', 'rechazar'].includes(accion)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Acción inválida. Use 'aprobar' o 'rechazar'" });
        }

        // Obtener la cuenta corriente
        const cuentaResult = await client.query(
            "SELECT * FROM cuentas_corrientes WHERE id = $1",
            [id]
        );

        if (cuentaResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Solicitud no encontrada" });
        }

        const cuenta = cuentaResult.rows[0];

        if (cuenta.estado !== 'pendiente') {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                error: `Esta solicitud ya fue ${cuenta.estado}. No se puede modificar.` 
            });
        }

        const usuarioId = cuenta.usuario_id;

        if (accion === 'aprobar') {
            // Aprobar cuenta
            await client.query(
                `UPDATE cuentas_corrientes 
                 SET estado = 'aprobada', 
                     fecha_aprobacion = NOW(),
                     notas_aprobacion = $1
                 WHERE id = $2`,
                [notas || 'Solicitud aprobada', id]
            );

            // Actualizar solicitud
            await client.query(
                `UPDATE solicitudes_productos 
                 SET estado = 'aprobada', 
                     fecha_resolucion = NOW(),
                     notas = $1
                 WHERE producto_id = $2 AND tipo_producto = 'cuenta_corriente'`,
                [notas || 'Solicitud aprobada', id]
            );

            // AHORA SÍ otorgar Magys por la aprobación
            const magysOtorgados = await otorgarMagysPorProducto(
                usuarioId, 
                'cuenta_corriente', 
                id, 
                client
            );

            await client.query('COMMIT');

            res.json({
                message: "Solicitud aprobada exitosamente",
                cuentaId: id,
                numeroCuenta: cuenta.numero_cuenta,
                estado: "aprobada",
                magysOtorgados
            });

        } else {
            // Rechazar cuenta
            await client.query(
                `UPDATE cuentas_corrientes 
                 SET estado = 'rechazada', 
                     motivo_rechazo = $1,
                     fecha_aprobacion = NOW()
                 WHERE id = $2`,
                [motivo || 'Solicitud rechazada', id]
            );

            // Actualizar solicitud
            await client.query(
                `UPDATE solicitudes_productos 
                 SET estado = 'rechazada', 
                     fecha_resolucion = NOW(),
                     motivo_rechazo = $1,
                     notas = $2
                 WHERE producto_id = $3 AND tipo_producto = 'cuenta_corriente'`,
                [motivo || 'Solicitud rechazada', notas, id]
            );

            await client.query('COMMIT');

            res.json({
                message: "Solicitud rechazada",
                cuentaId: id,
                estado: "rechazada",
                motivo: motivo || 'Solicitud rechazada'
            });
        }

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error al aprobar/rechazar solicitud:", error);
        res.status(500).json({ error: "Error al procesar la solicitud" });
    } finally {
        client.release();
    }
};

// Listar todas las solicitudes pendientes (ADMIN)
exports.listarSolicitudesPendientes = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                cc.id,
                cc.numero_cuenta,
                cc.usuario_id,
                u.nombre as usuario_nombre,
                u.email as usuario_email,
                cc.estado,
                cc.fecha_solicitud
             FROM cuentas_corrientes cc
             JOIN usuarios u ON cc.usuario_id = u.id
             WHERE cc.estado = 'pendiente'
             ORDER BY cc.fecha_solicitud ASC`
        );

        res.json({ 
            solicitudes: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error("Error al listar solicitudes:", error);
        res.status(500).json({ error: "Error al obtener solicitudes" });
    }
};
