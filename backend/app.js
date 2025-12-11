// app.js
const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '.env') });
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth");
const magysRoutes = require("./routes/magys");
const chatRoutes = require("./routes/chat");
const cuentaCorrienteRoutes = require("./routes/cuentaCorriente");
const userRoutes = require("./routes/user");
const juegosRoutes = require("./routes/juegos");
const premiosRoutes = require("./routes/premios");

const app = express();

// Ensure required JWT secrets exist
if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error("Missing JWT_ACCESS_SECRET or JWT_REFRESH_SECRET environment variables. Aborting startup.");
  process.exit(1);
}

// Middlewares
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// Rate limiter (ajustar en producción)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200
});
app.use(limiter);

// More strict limiter for auth endpoints applied at route level in routes/auth.js

// CORS
// CORS: support comma-separated list in CORS_ORIGIN env var
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
let originOption = corsOrigin;
if (corsOrigin.includes(",")) {
  const allowed = corsOrigin.split(",").map(s => s.trim());
  originOption = function(origin, callback) {
    // allow requests with no origin (e.g., server-to-server, curl)
    if (!origin) return callback(null, true);
    if (allowed.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error('CORS origin not allowed'));
  };
}
app.use(cors({ origin: originOption, credentials: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/magys", magysRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/cuenta-corriente", cuentaCorrienteRoutes);
app.use("/api/user", userRoutes);
app.use("/api/juegos", juegosRoutes);
app.use("/api/premios", premiosRoutes);

// Basic health
app.get("/health", (req, res) => res.json({ ok: true, env: process.env.NODE_ENV || "dev" }));

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
    process.exit(1);
});

module.exports = app;