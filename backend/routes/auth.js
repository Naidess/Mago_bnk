// routes/auth.js
const express = require("express");
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const authController = require("../controllers/authcontroller");
const authenticate = require("../middlewares/authenticate");

// stricter rate limit for auth actions to mitigate brute force
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { error: "Too many auth attempts, please try again later." }
});

router.post("/register", [
    body("nombre").isLength({ min: 2 }).withMessage("Nombre mínimo 2 caracteres"),
    body("email").isEmail().withMessage("Email inválido"),
    body("password").isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres")
], authController.register);

router.post("/login", authLimiter, [
    body("email").isEmail().withMessage("Email inválido"),
    body("password").exists().withMessage("Password requerido")
], authController.login);

router.post("/refresh", authController.refreshToken);
router.post("/logout", authController.logout);
router.post("/change-password", authenticate, [
    body("currentPassword").exists().withMessage("Contraseña actual requerida"),
    body("newPassword").isLength({ min: 6 }).withMessage("La nueva contraseña debe tener al menos 6 caracteres")
], authController.changePassword);
router.post("/forgot-password", [ body("email").isEmail().withMessage("Email inválido") ], authController.forgotPassword);
router.post("/reset-password", [ body("token").exists(), body("id").isInt().withMessage("id inválido"), body("password").isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres") ], authController.resetPassword);

module.exports = router;
