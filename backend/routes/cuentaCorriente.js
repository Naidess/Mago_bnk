// routes/cuentaCorriente.js
const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authenticate");
const {
    solicitarCuentaCorriente,
    obtenerCuentasCorrientes,
    obtenerDetalleCuenta,
    obtenerHistorialMagys,
    aprobarRechazarSolicitud,
    listarSolicitudesPendientes
} = require("../controllers/cuentaCorrienteController");

// Solicitar nueva cuenta corriente
router.post("/solicitar", authenticate, solicitarCuentaCorriente);

// Obtener cuentas corrientes del usuario
router.get("/", authenticate, obtenerCuentasCorrientes);

// Obtener detalle de una cuenta específica
router.get("/:id", authenticate, obtenerDetalleCuenta);

// Obtener historial de Magys
router.get("/magys/historial", authenticate, obtenerHistorialMagys);

// ADMIN: Listar solicitudes pendientes
router.get("/admin/solicitudes-pendientes", authenticate, listarSolicitudesPendientes);

// ADMIN: Aprobar o rechazar solicitud
router.post("/admin/solicitud/:id", authenticate, aprobarRechazarSolicitud);

module.exports = router;
