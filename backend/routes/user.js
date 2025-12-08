// routes/user.js
const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authenticate");
const { getDashboard } = require("../controllers/userController");

// Dashboard del usuario
router.get("/dashboard", authenticate, getDashboard);

module.exports = router;
