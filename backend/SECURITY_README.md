# 🔐 Configuración de Seguridad - Backend

## Variables de Entorno

Este proyecto usa variables de entorno para datos sensibles. **NUNCA** commitees el archivo `.env` real.

### Configuración Inicial

1. Copia el archivo de ejemplo:
```bash
cp .env.example .env
```

2. Edita `.env` con tus valores reales:
```bash
# Genera secrets seguros con:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

3. Actualiza las variables críticas:
   - `DATABASE_URL`: Tu conexión PostgreSQL
   - `JWT_ACCESS_SECRET`: Secret único para tokens de acceso
   - `JWT_REFRESH_SECRET`: Secret único para tokens de refresh
   - `GEMINI_API_KEY`: Tu API key de Google Gemini AI

## ⚠️ Importante

### NO commitear:
- ❌ `.env` (contiene datos reales)
- ❌ Contraseñas en texto plano
- ❌ API keys (Gemini, OpenAI, etc.)
- ❌ Tokens de servicios externos
- ❌ Certificados privados (`.key`, `.pem`)
- ❌ Credenciales de SMTP/Email

### SÍ commitear:
- ✅ `.env.example` (plantilla sin datos sensibles)
- ✅ Este README
- ✅ Documentación de configuración

## 🛡️ Buenas Prácticas

1. **Rotación de secrets**: Cambia los JWT secrets periódicamente
2. **Contraseñas fuertes**: Usa contraseñas complejas para BD
3. **HTTPS en producción**: Siempre usa SSL/TLS
4. **Backups seguros**: Encripta backups de base de datos
5. **Logs**: No loguees contraseñas ni tokens

## 🔑 Generación de Secrets

### JWT Secrets (recomendado: 32+ bytes)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Password Hash (ya configurado con bcrypt)
- `BCRYPT_SALT_ROUNDS=12` (mínimo recomendado)
- Mayor valor = más seguro pero más lento

## 📋 Checklist de Seguridad

- [ ] `.env` en `.gitignore`
- [ ] Secrets únicos generados
- [ ] Contraseña de BD fuerte
- [ ] Rate limiting configurado
- [ ] CORS configurado correctamente
- [ ] Validación de inputs activa
- [ ] Logs de autenticación habilitados
