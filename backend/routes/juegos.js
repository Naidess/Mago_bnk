// routes/juegos.js
const express = require("express");
const router = express.Router();
const juegoController = require("../controllers/juegoController");
const authenticate = require("../middlewares/authenticate");

// Todas las rutas requieren autenticación
router.use(authenticate);

// Listar juegos disponibles
router.get("/", juegoController.listarJuegos);

// Obtener símbolos de un juego específico
router.get("/:juegoId/simbolos", juegoController.obtenerSimbolos);

// Jugar tragamonedas
router.post("/slots/jugar", juegoController.jugarSlots);

// Obtener saldo de tickets
router.get("/tickets", juegoController.obtenerTickets);

// Obtener historial de jugadas
router.get("/historial", juegoController.obtenerHistorial);

module.exports = router;
