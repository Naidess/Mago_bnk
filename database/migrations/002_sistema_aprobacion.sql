-- Migración: Agregar sistema de aprobación de productos
-- Ejecutar este script después de la migración 001

-- Modificar tabla cuentas_corrientes para agregar estados de solicitud
ALTER TABLE cuentas_corrientes 
    DROP CONSTRAINT IF EXISTS cuentas_corrientes_estado_check;

ALTER TABLE cuentas_corrientes 
    ALTER COLUMN estado SET DEFAULT 'pendiente';

-- Actualizar constraint para incluir nuevos estados
ALTER TABLE cuentas_corrientes
    ADD CONSTRAINT cuentas_corrientes_estado_check 
    CHECK (estado IN ('pendiente', 'aprobada', 'rechazada', 'bloqueada', 'cerrada'));

-- Agregar columnas adicionales para el flujo de aprobación
ALTER TABLE cuentas_corrientes
    ADD COLUMN IF NOT EXISTS fecha_solicitud TIMESTAMP DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS fecha_aprobacion TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS aprobado_por INT NULL REFERENCES usuarios(id),
    ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT NULL,
    ADD COLUMN IF NOT EXISTS notas_aprobacion TEXT NULL;

-- Crear tabla de solicitudes (para tracking histórico y auditoría)
CREATE TABLE IF NOT EXISTS solicitudes_productos (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_producto VARCHAR(50) NOT NULL, -- 'cuenta_corriente', 'tarjeta_credito', etc.
    producto_id INT NULL, -- ID del producto creado (NULL si está pendiente)
    estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, aprobada, rechazada
    fecha_solicitud TIMESTAMP DEFAULT NOW(),
    fecha_resolucion TIMESTAMP NULL,
    resuelto_por INT NULL REFERENCES usuarios(id),
    motivo_rechazo TEXT NULL,
    notas TEXT NULL,
    datos_adicionales JSONB NULL -- Para almacenar datos específicos de cada tipo de producto
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_solicitudes_usuario ON solicitudes_productos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes_productos(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_tipo ON solicitudes_productos(tipo_producto);
CREATE INDEX IF NOT EXISTS idx_cuentas_corrientes_estado_solicitud ON cuentas_corrientes(estado, fecha_solicitud);

-- Comentarios para documentación
COMMENT ON COLUMN cuentas_corrientes.estado IS 'Estados: pendiente (recién solicitada), aprobada (activa), rechazada, bloqueada, cerrada';
COMMENT ON TABLE solicitudes_productos IS 'Registro histórico de todas las solicitudes de productos financieros';
