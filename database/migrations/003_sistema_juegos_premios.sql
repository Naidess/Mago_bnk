-- ==========================================
-- SISTEMA DE JUEGOS Y PREMIOS - MAGO BANK
-- ==========================================

-- Tabla de juegos disponibles (modular)
CREATE TABLE IF NOT EXISTS juegos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    costo_minimo INTEGER NOT NULL DEFAULT 10, -- Mínimo de Magys para jugar
    costo_maximo INTEGER, -- Máximo permitido (null = sin límite)
    activo BOOLEAN DEFAULT true,
    rtp DECIMAL(5,2), -- Return to Player (ej: 45.00 = 45%)
    house_edge DECIMAL(5,2), -- Ventaja de la casa (ej: 55.00 = 55%)
    tipo VARCHAR(50) NOT NULL, -- 'slots', 'ruleta', 'dados', etc.
    configuracion JSONB, -- Configuración específica del juego
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla de símbolos del tragamonedas (reutilizable)
CREATE TABLE IF NOT EXISTS slot_simbolos (
    id SERIAL PRIMARY KEY,
    juego_id INTEGER REFERENCES juegos(id) ON DELETE CASCADE,
    simbolo VARCHAR(10) NOT NULL, -- Emoji o código
    nombre VARCHAR(50) NOT NULL,
    probabilidad DECIMAL(5,2) NOT NULL, -- En porcentaje (ej: 30.00 = 30%)
    multiplicador INTEGER NOT NULL, -- x2, x3, x10, etc.
    orden INTEGER DEFAULT 0, -- Para mostrar en orden
    UNIQUE(juego_id, simbolo)
);

-- Tabla de historial de jugadas
CREATE TABLE IF NOT EXISTS juegos_historial (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    juego_id INTEGER REFERENCES juegos(id) ON DELETE CASCADE,
    apuesta INTEGER NOT NULL, -- Magys apostados
    resultado JSONB NOT NULL, -- Detalles del resultado (carretes, multiplicador, etc.)
    ganancia INTEGER NOT NULL, -- Tickets ganados (puede ser 0)
    magys_gastados INTEGER NOT NULL,
    fecha_jugado TIMESTAMP DEFAULT NOW(),
    ip VARCHAR(50)
);

-- Tabla de tickets (moneda del casino)
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    saldo INTEGER NOT NULL DEFAULT 0,
    total_ganado INTEGER NOT NULL DEFAULT 0, -- Histórico total
    total_canjeado INTEGER NOT NULL DEFAULT 0, -- Histórico canjeado
    actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla de premios canjeables
CREATE TABLE IF NOT EXISTS premios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    imagen_url VARCHAR(500),
    costo_tickets INTEGER NOT NULL, -- Tickets necesarios
    stock INTEGER, -- null = ilimitado
    activo BOOLEAN DEFAULT true,
    categoria VARCHAR(100), -- 'fisico', 'digital', 'descuento', 'magys'
    valor_real DECIMAL(10,2), -- Valor en dinero real (referencia)
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla de canjes realizados
CREATE TABLE IF NOT EXISTS canjes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    premio_id INTEGER REFERENCES premios(id) ON DELETE SET NULL,
    tickets_gastados INTEGER NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'procesando', 'entregado', 'cancelado'
    direccion_envio TEXT, -- Si aplica
    codigo_seguimiento VARCHAR(200),
    fecha_canje TIMESTAMP DEFAULT NOW(),
    fecha_entrega TIMESTAMP,
    notas TEXT
);

-- Índices para optimización
CREATE INDEX idx_juegos_historial_usuario ON juegos_historial(usuario_id);
CREATE INDEX idx_juegos_historial_fecha ON juegos_historial(fecha_jugado DESC);
CREATE INDEX idx_tickets_usuario ON tickets(usuario_id);
CREATE INDEX idx_canjes_usuario ON canjes(usuario_id);
CREATE INDEX idx_canjes_estado ON canjes(estado);

-- Trigger para actualizar tickets.actualizado_en
CREATE OR REPLACE FUNCTION actualizar_tickets_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_tickets
BEFORE UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION actualizar_tickets_timestamp();

-- ==========================================
-- DATOS INICIALES: TRAGAMONEDAS
-- ==========================================

-- Insertar juego de tragamonedas
INSERT INTO juegos (nombre, descripcion, costo_minimo, costo_maximo, activo, rtp, house_edge, tipo, configuracion)
VALUES (
    'Tragamonedas Clásico',
    '¡Gira los carretes y gana tickets! 3 símbolos iguales = premio',
    10,
    1000,
    true,
    45.00,
    55.00,
    'slots',
    '{"carretes": 3, "animacion": true, "sonidos": true}'::jsonb
) ON CONFLICT (nombre) DO NOTHING;

-- Insertar símbolos del tragamonedas (ajustados para RTP ~45%)
INSERT INTO slot_simbolos (juego_id, simbolo, nombre, probabilidad, multiplicador, orden)
SELECT 
    (SELECT id FROM juegos WHERE nombre = 'Tragamonedas Clásico'),
    simbolo, nombre, probabilidad, multiplicador, orden
FROM (VALUES
    ('🍒', 'Cherry', 35.00, 2, 1),
    ('🍋', 'Limón', 28.00, 3, 2),
    ('🔔', 'Campana', 20.00, 5, 3),
    ('💎', 'Diamante', 12.00, 10, 4),
    ('⭐', 'Estrella', 4.00, 25, 5),
    ('👑', 'Jackpot', 1.00, 100, 6)
) AS datos(simbolo, nombre, probabilidad, multiplicador, orden)
ON CONFLICT (juego_id, simbolo) DO NOTHING;

-- ==========================================
-- DATOS INICIALES: PREMIOS
-- ==========================================

INSERT INTO premios (nombre, descripcion, costo_tickets, stock, categoria, valor_real, imagen_url)
VALUES
    ('100 Magys', 'Recarga de 100 Magys a tu cuenta', 50, NULL, 'magys', 1.00, NULL),
    ('500 Magys', 'Recarga de 500 Magys a tu cuenta', 200, NULL, 'magys', 5.00, NULL),
    ('1000 Magys', 'Recarga de 1000 Magys a tu cuenta', 350, NULL, 'magys', 10.00, NULL),
    ('Descuento 10%', 'Cupón de 10% en tu próxima compra', 80, 100, 'descuento', 2.00, NULL),
    ('Descuento 25%', 'Cupón de 25% en tu próxima compra', 180, 50, 'descuento', 5.00, NULL),
    ('Tarjeta Regalo ₲75.000', 'Tarjeta de regalo digital de ₲75.000', 250, 20, 'digital', 75000, NULL),
    ('Tarjeta Regalo ₲185.000', 'Tarjeta de regalo digital de ₲185.000', 550, 10, 'digital', 185000, NULL),
    ('Producto Físico ₲370.000', 'Producto sorpresa enviado a tu domicilio', 800, 5, 'fisico', 370000, NULL)
ON CONFLICT DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE juegos IS 'Catálogo de juegos disponibles en el casino';
COMMENT ON TABLE slot_simbolos IS 'Símbolos y probabilidades para tragamonedas';
COMMENT ON TABLE juegos_historial IS 'Registro de todas las jugadas realizadas';
COMMENT ON TABLE tickets IS 'Saldo de tickets de cada usuario (moneda del casino)';
COMMENT ON TABLE premios IS 'Catálogo de premios canjeables con tickets';
COMMENT ON TABLE canjes IS 'Historial de canjes de premios realizados';

-- Verificación
SELECT 'Migración 003 completada exitosamente' AS status;
