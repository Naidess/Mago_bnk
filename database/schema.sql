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

-- Cuentas corrientes
CREATE TABLE cuentas_corrientes (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    numero_cuenta VARCHAR(20) UNIQUE NOT NULL,
    saldo DECIMAL(15, 2) DEFAULT 0.00,
    estado VARCHAR(20) DEFAULT 'activa', -- activa, bloqueada, cerrada
    fecha_apertura TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- Reglas de acumulación de Magys por productos
CREATE TABLE magys_reglas (
    id SERIAL PRIMARY KEY,
    tipo_producto VARCHAR(50) UNIQUE NOT NULL, -- 'cuenta_corriente', 'tarjeta_credito', etc.
    magys_por_activacion INT NOT NULL, -- Magys que se otorgan al activar el producto
    magys_mensuales INT DEFAULT 0, -- Magys recurrentes mensuales (si aplica)
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Historial de Magys otorgados
CREATE TABLE magys_historial (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_evento VARCHAR(50) NOT NULL, -- 'activacion_producto', 'mensual', 'canje', etc.
    producto_id INT NULL, -- Referencia al producto que generó los Magys
    producto_tipo VARCHAR(50) NULL, -- 'cuenta_corriente', etc.
    cantidad INT NOT NULL,
    descripcion TEXT,
    fecha TIMESTAMP DEFAULT NOW()
);

-- Insertar reglas iniciales de Magys
INSERT INTO magys_reglas (tipo_producto, magys_por_activacion, magys_mensuales, descripcion) 
VALUES 
    ('cuenta_corriente', 500, 50, 'Magys por apertura y mantenimiento de cuenta corriente'),
    ('tarjeta_credito', 1000, 100, 'Magys por activación y uso de tarjeta de crédito'),
    ('prestamo', 750, 0, 'Magys por contratación de préstamo');
