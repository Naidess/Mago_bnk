// routes/magys.js
const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authenticate");
const { getSaldo, sumarMagys, canjearMagys } = require("../controllers/magysController");

router.get("/saldo", authenticate, getSaldo);
router.post("/sumar", authenticate, sumarMagys);
router.post("/canjear", authenticate, canjearMagys);

module.exports = router;