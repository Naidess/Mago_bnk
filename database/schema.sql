CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE magys (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    saldo INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE mensajes (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    mensaje_usuario TEXT NOT NULL,
    mensaje_magdy TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transacciones (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    cantidad INT NOT NULL,
    fecha TIMESTAMP DEFAULT NOW()
);

-- Persisted refresh tokens for revocation and rotation
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP NULL
);

-- Authentication audit log
CREATE TABLE auth_logs (
    id SERIAL PRIMARY KEY,
    usuario_id INT NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    ip VARCHAR(100) NULL,
    action VARCHAR(50) NOT NULL,
    success BOOLEAN NOT NULL,
    reason TEXT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Password reset tokens (one-time, hashed)
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP NULL
);