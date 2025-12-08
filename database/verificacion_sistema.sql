-- Script de verificación rápida
-- Ejecutar después de la migración

-- 1. Verificar que las tablas fueron creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('cuentas_corrientes', 'magys_reglas', 'magys_historial');

-- 2. Ver las reglas de Magys configuradas
SELECT * FROM magys_reglas;

-- 3. Ver cuentas corrientes existentes (debería estar vacío inicialmente)
SELECT cc.*, u.nombre, u.email 
FROM cuentas_corrientes cc 
JOIN usuarios u ON cc.usuario_id = u.id;

-- 4. Ver historial de Magys (se irá llenando cuando los usuarios soliciten productos)
SELECT mh.*, u.nombre, u.email 
FROM magys_historial mh 
JOIN usuarios u ON mh.usuario_id = u.id 
ORDER BY mh.fecha DESC 
LIMIT 10;

-- 5. Ver saldo actual de Magys de todos los usuarios
SELECT u.nombre, u.email, m.saldo as magys_saldo 
FROM usuarios u 
LEFT JOIN magys m ON u.id = m.usuario_id 
ORDER BY m.saldo DESC;
