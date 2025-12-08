-- Migración: Agregar sistema de cuentas corrientes y acumulación de Magys
-- Ejecutar este script en tu base de datos PostgreSQL

-- Cuentas corrientes
CREATE TABLE IF NOT EXISTS cuentas_corrientes (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    numero_cuenta VARCHAR(20) UNIQUE NOT NULL,
    saldo DECIMAL(15, 2) DEFAULT 0.00,
    estado VARCHAR(20) DEFAULT 'activa', -- activa, bloqueada, cerrada
    fecha_apertura TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- Reglas de acumulación de Magys por productos
CREATE TABLE IF NOT EXISTS magys_reglas (
    id SERIAL PRIMARY KEY,
    tipo_producto VARCHAR(50) UNIQUE NOT NULL, -- 'cuenta_corriente', 'tarjeta_credito', etc.
    magys_por_activacion INT NOT NULL, -- Magys que se otorgan al activar el producto
    magys_mensuales INT DEFAULT 0, -- Magys recurrentes mensuales (si aplica)
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Historial de Magys otorgados
CREATE TABLE IF NOT EXISTS magys_historial (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_evento VARCHAR(50) NOT NULL, -- 'activacion_producto', 'mensual', 'canje', etc.
    producto_id INT NULL, -- Referencia al producto que generó los Magys
    producto_tipo VARCHAR(50) NULL, -- 'cuenta_corriente', etc.
    cantidad INT NOT NULL,
    descripcion TEXT,
    fecha TIMESTAMP DEFAULT NOW()
);

-- Insertar reglas iniciales de Magys (solo si no existen)
INSERT INTO magys_reglas (tipo_producto, magys_por_activacion, magys_mensuales, descripcion) 
VALUES 
    ('cuenta_corriente', 500, 50, 'Magys por apertura y mantenimiento de cuenta corriente'),
    ('tarjeta_credito', 1000, 100, 'Magys por activación y uso de tarjeta de crédito'),
    ('prestamo', 750, 0, 'Magys por contratación de préstamo')
ON CONFLICT (tipo_producto) DO NOTHING;

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_cuentas_corrientes_usuario ON cuentas_corrientes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cuentas_corrientes_estado ON cuentas_corrientes(estado);
CREATE INDEX IF NOT EXISTS idx_magys_historial_usuario ON magys_historial(usuario_id);
CREATE INDEX IF NOT EXISTS idx_magys_historial_fecha ON magys_historial(fecha DESC);
