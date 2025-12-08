// controllers/authController.js
require("dotenv").config();
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const crypto = require("crypto");

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12");
const ACCESS_EXP = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const REFRESH_EXP = process.env.REFRESH_TOKEN_EXPIRY || "7d";
const MAX_FAILED = parseInt(process.env.MAX_FAILED_LOGIN || "5");
const LOCK_MINUTES = parseInt(process.env.LOCK_MINUTES || "15");

function generateAccessToken(payload) {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_EXP });
}
function generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXP });
}

async function saveRefreshToken(usuarioId, token) {
    const tokenHash = await bcrypt.hash(token, SALT_ROUNDS);
    const decoded = jwt.decode(token);
    const expiresAt = decoded && decoded.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const result = await pool.query(
        "INSERT INTO refresh_tokens (usuario_id, token_hash, expires_at) VALUES ($1,$2,$3) RETURNING id",
        [usuarioId, tokenHash, expiresAt]
    );
    return result.rows[0];
}

async function findValidRefreshToken(usuarioId, token) {
    const now = new Date();
    const result = await pool.query(
        "SELECT id, token_hash, revoked, expires_at FROM refresh_tokens WHERE usuario_id = $1 AND revoked = false AND expires_at > $2",
        [usuarioId, now]
    );
    for (const row of result.rows) {
        // compare hashes
        const match = await bcrypt.compare(token, row.token_hash);
        if (match) return row;
    }
    return null;
}

async function revokeTokenById(id) {
    await pool.query("UPDATE refresh_tokens SET revoked = true, revoked_at = NOW() WHERE id = $1", [id]);
}

async function logAuth({ usuarioId = null, ip = null, action = "unknown", success = false, reason = null }) {
    try {
        await pool.query(
            "INSERT INTO auth_logs (usuario_id, ip, action, success, reason) VALUES ($1,$2,$3,$4,$5)",
            [usuarioId, ip, action, success, reason]
        );
    } catch (err) {
        console.error("Failed to write auth log", err);
    }
}

exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    let { nombre, email, password } = req.body;
    email = (email || "").toLowerCase().trim();
    try {
        const exists = await pool.query("SELECT id FROM usuarios WHERE email = $1", [email]);
        if (exists.rows.length) return res.status(400).json({ error: "Email ya registrado" });

        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        const result = await pool.query(
            "INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1,$2,$3) RETURNING id,nombre,email",
            [nombre, email, hash]
        );

        // create magys row
        await pool.query("INSERT INTO magys (usuario_id, saldo) VALUES ($1, 0)", [result.rows[0].id]);

        res.json({ message: "Registrado correctamente", user: { id: result.rows[0].id, nombre: result.rows[0].nombre, email: result.rows[0].email } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error del servidor" });
    }
};

exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    let { email, password } = req.body;
    email = (email || "").toLowerCase().trim();
    const ip = req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress || null;
    console.log(`[auth] login attempt for: ${email} from ip=${ip}`);
    try {
        console.log('[auth] querying user by email...');
        const result = await pool.query("SELECT id, nombre, email, password_hash, failed_login_attempts, locked_until FROM usuarios WHERE email = $1", [email]);
        console.log('[auth] user query completed');
        if (result.rows.length === 0) {
            // log generic failure (no user)
            await logAuth({ usuarioId: null, ip, action: "login", success: false, reason: "invalid_credentials" });
            console.log(`[auth] login failed: user not found ${email}`);
            return res.status(400).json({ error: "Credenciales inválidas" });
        }

        const user = result.rows[0];
        const now = new Date();
        if (user.locked_until && now < new Date(user.locked_until)) {
            await logAuth({ usuarioId: user.id, ip, action: "login", success: false, reason: "account_locked" });
            return res.status(423).json({ error: `Cuenta bloqueada hasta ${user.locked_until}` });
        }

        console.log('[auth] comparing password hash...');
        const valid = await bcrypt.compare(password, user.password_hash);
        console.log('[auth] password compare completed');
        if (!valid) {
            // increment failed attempts
            const attempts = (user.failed_login_attempts || 0) + 1;
            let lockedUntil = null;
            if (attempts >= MAX_FAILED) {
                lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
            }
            await pool.query("UPDATE usuarios SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3", [attempts, lockedUntil, user.id]);
            await logAuth({ usuarioId: user.id, ip, action: "login", success: false, reason: "invalid_credentials" });
            console.log(`[auth] login failed: invalid credentials for userId=${user.id}`);
            return res.status(400).json({ error: "Credenciales inválidas" });
        }

        // success: reset failed attempts
        try {
            console.log('[auth] resetting failed attempts for user...');
            await pool.query("UPDATE usuarios SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1", [user.id]);
            console.log('[auth] reset failed attempts completed');
        } catch (err) {
            console.error('[auth] error resetting failed attempts', err);
            // continue - don't block login on this non-critical error
        }

        const payload = { id: user.id, email: user.email };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        // persist refresh token hash
        try {
            console.log('[auth] saving refresh token hash...');
            await saveRefreshToken(user.id, refreshToken);
            console.log('[auth] refresh token saved');
        } catch (err) {
            console.error("Failed to save refresh token", err);
        }

        // Set secure HttpOnly cookie for refresh token
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        await logAuth({ usuarioId: user.id, ip, action: "login", success: true });
        console.log(`[auth] login success userId=${user.id}`);

        res.json({ accessToken, user: { id: user.id, nombre: user.nombre, email: user.email } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error del servidor" });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        const ip = req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress || null;
        if (!token) return res.status(401).json({ error: "Refresh token requerido" });

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        } catch (err) {
            return res.status(401).json({ error: "Refresh token inválido" });
        }

        // find persisted token
        const found = await findValidRefreshToken(decoded.id, token);
        if (!found) {
            await logAuth({ usuarioId: decoded.id, ip, action: "refresh", success: false, reason: "token_not_found_or_revoked" });
            return res.status(401).json({ error: "Refresh token inválido o revocado" });
        }

        // rotate: revoke old and issue new
        await revokeTokenById(found.id);
        const payload = { id: decoded.id, email: decoded.email };
        const newAccess = generateAccessToken(payload);
        const newRefresh = generateRefreshToken(payload);
        try {
            await saveRefreshToken(decoded.id, newRefresh);
        } catch (err) {
            console.error("Failed saving new refresh token", err);
        }

        res.cookie("refreshToken", newRefresh, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        await logAuth({ usuarioId: decoded.id, ip, action: "refresh", success: true });
        res.json({ accessToken: newAccess });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error servidor" });
    }
};

exports.logout = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        const ip = req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress || null;
        if (token) {
            try {
                const decoded = jwt.decode(token);
                if (decoded && decoded.id) {
                    const found = await findValidRefreshToken(decoded.id, token);
                    if (found) await revokeTokenById(found.id);
                    await logAuth({ usuarioId: decoded.id, ip, action: "logout", success: true });
                }
            } catch (err) {
                console.error("Error revoking refresh token on logout", err);
            }
        }

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/"
        });
        res.json({ message: "Sesión cerrada" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error servidor" });
    }
};

// Request password reset: generate one-time token, persist hashed, return reset link (or send email in prod)
exports.forgotPassword = async (req, res) => {
    const { email } = req.body || {};
    const ip = req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress || null;
    if (!email) return res.status(400).json({ error: "Email requerido" });
    try {
        const userRes = await pool.query("SELECT id, email FROM usuarios WHERE email = $1", [email.toLowerCase().trim()]);
        if (!userRes.rows.length) {
            // don't reveal existence
            await logAuth({ usuarioId: null, ip, action: "forgot_password", success: false, reason: "email_not_found" });
            return res.json({ message: "Si el email existe, recibirás instrucciones para resetear la contraseña." });
        }
        const user = userRes.rows[0];

        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = await bcrypt.hash(token, SALT_ROUNDS);
        const expiresAt = new Date(Date.now() + (process.env.PW_RESET_EXP_MINUTES ? parseInt(process.env.PW_RESET_EXP_MINUTES) * 60000 : 60 * 60 * 1000)); // default 60min

        await pool.query(
            "INSERT INTO password_reset_tokens (usuario_id, token_hash, expires_at) VALUES ($1,$2,$3)",
            [user.id, tokenHash, expiresAt]
        );

        // In production you would send an email. For now return the reset link to the client (dev only).
        const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
        const resetUrl = `${frontend}/reset?token=${encodeURIComponent(token)}&id=${user.id}`;

        await logAuth({ usuarioId: user.id, ip, action: "forgot_password", success: true });
        return res.json({ message: "Instrucciones enviadas si el email existe.", resetUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error del servidor" });
    }
};

// Perform password reset using token and new password
exports.resetPassword = async (req, res) => {
    const { token, id, password } = req.body || {};
    const ip = req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress || null;
    if (!token || !id || !password) return res.status(400).json({ error: "Parámetros requeridos" });
    try {
        const now = new Date();
        const rows = await pool.query(
            "SELECT id, token_hash, expires_at, used FROM password_reset_tokens WHERE usuario_id = $1 ORDER BY created_at DESC LIMIT 10",
            [id]
        );

        let matched = null;
        for (const row of rows.rows) {
            if (row.used) continue;
            if (new Date(row.expires_at) < now) continue;
            const ok = await bcrypt.compare(token, row.token_hash);
            if (ok) { matched = row; break; }
        }

        if (!matched) {
            await logAuth({ usuarioId: id, ip, action: "reset_password", success: false, reason: "invalid_or_expired_token" });
            return res.status(400).json({ error: "Token inválido o expirado" });
        }

        // update password
        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        await pool.query("UPDATE usuarios SET password_hash = $1 WHERE id = $2", [hash, id]);

        // mark token used
        await pool.query("UPDATE password_reset_tokens SET used = true, used_at = NOW() WHERE id = $1", [matched.id]);

        // revoke all refresh tokens for user (force re-login)
        await pool.query("UPDATE refresh_tokens SET revoked = true, revoked_at = NOW() WHERE usuario_id = $1", [id]);

        await logAuth({ usuarioId: id, ip, action: "reset_password", success: true });
        return res.json({ message: "Contraseña actualizada correctamente" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error del servidor" });
    }
};