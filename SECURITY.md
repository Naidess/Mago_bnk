# CONFIGURACIÓN DE SEGURIDAD - MAGO BANK

## ⚠️ ARCHIVOS PROTEGIDOS

Este `.gitignore` está configurado para proteger:

### 🔐 Datos Sensibles
- `.env` y todas sus variantes (`.env.local`, `.env.production`, etc.)
- Archivos de certificados (`.pem`, `.key`, `.cert`)
- Credenciales y secrets

### 🗄️ Base de Datos
- Archivos de respaldo SQL (excepto `schema.sql`)
- Archivos SQLite locales
- Datos de volúmenes Docker

### 📝 Configuración del Equipo

Para comenzar a trabajar en el proyecto:

1. **Copia el archivo de ejemplo:**
   ```bash
   cp backend/.env.example backend/.env
   ```

2. **Configura tus variables:**
   - `DATABASE_URL`: Credenciales de PostgreSQL
   - `JWT_ACCESS_SECRET`: Token de acceso (genera uno único)
   - `JWT_REFRESH_SECRET`: Token de refresh (genera uno único)

3. **Genera secrets seguros:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

## 🚨 NUNCA COMMITS

- Archivos `.env` con datos reales
- Contraseñas o API keys
- Tokens JWT reales
- Credenciales de base de datos
- Certificados SSL privados

## ✅ SÍ COMMITEA

- `.env.example` (plantilla sin datos sensibles)
- `schema.sql` (estructura de base de datos)
- Documentación y configuraciones públicas
