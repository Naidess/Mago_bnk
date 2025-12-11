// routes/premios.js
const express = require("express");
const router = express.Router();
const premioController = require("../controllers/premioController");
const authenticate = require("../middlewares/authenticate");

// Todas las rutas requieren autenticación
router.use(authenticate);

// Listar premios disponibles
router.get("/", premioController.listarPremios);

// Canjear premio
router.post("/canjear", premioController.canjearPremio);

// Historial de canjes
router.get("/canjes", premioController.obtenerCanjes);

// Estadísticas del usuario
router.get("/estadisticas", premioController.obtenerEstadisticas);

module.exports = router;
