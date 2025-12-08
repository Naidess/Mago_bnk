// controllers/userController.js
const pool = require("../db");

exports.getDashboard = async (req, res) => {
    try {
        const usuarioId = req.user.id;

        // Obtener datos del usuario
        const userResult = await pool.query(
            "SELECT id, nombre as name, email FROM usuarios WHERE id = $1",
            [usuarioId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const user = userResult.rows[0];

        // Obtener saldo de Magys
        const magysResult = await pool.query(
            "SELECT saldo FROM magys WHERE usuario_id = $1",
            [usuarioId]
        );

        const magys = magysResult.rows.length > 0 ? magysResult.rows[0].saldo : 0;

        // Obtener cuentas corrientes (accounts) - solo las aprobadas
        const accountsResult = await pool.query(
            `SELECT 
                id, 
                numero_cuenta as number, 
                saldo as balance 
             FROM cuentas_corrientes 
             WHERE usuario_id = $1 AND estado = 'aprobada'
             ORDER BY fecha_aprobacion DESC`,
            [usuarioId]
        );

        const accounts = accountsResult.rows.map(acc => ({
            id: acc.id,
            number: acc.number,
            balance: parseFloat(acc.balance)
        }));

        // Obtener otros productos (simulado por ahora)
        const products = [];

        // Obtener solicitudes pendientes para mostrarlas por separado
        const solicitudesPendientesResult = await pool.query(
            `SELECT 
                cc.id,
                cc.numero_cuenta,
                cc.fecha_solicitud,
                'cuenta_corriente' as tipo_producto,
                'Cuenta Corriente' as nombre_producto
             FROM cuentas_corrientes cc
             WHERE cc.usuario_id = $1 AND cc.estado = 'pendiente'
             ORDER BY cc.fecha_solicitud DESC`,
            [usuarioId]
        );

        const solicitudesPendientes = solicitudesPendientesResult.rows.map(sol => ({
            id: sol.id,
            numeroCuenta: sol.numero_cuenta,
            tipoProducto: sol.tipo_producto,
            nombreProducto: sol.nombre_producto,
            fechaSolicitud: sol.fecha_solicitud,
            estado: 'pendiente'
        }));

        // Las cuentas corrientes ya se muestran en su propia sección
        // No las agregamos a products para evitar duplicación

        res.json({
            user,
            magys,
            accounts,
            products,
            solicitudesPendientes
        });

    } catch (error) {
        console.error("Error al obtener dashboard:", error);
        res.status(500).json({ error: "Error al cargar el dashboard" });
    }
};
