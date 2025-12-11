# 🏦 Mago Bank

Sistema bancario digital con gamificación integrada. Permite a los usuarios gestionar cuentas corrientes, acumular puntos Magys, jugar en un casino virtual y canjear premios.

![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![React](https://img.shields.io/badge/React-18.2-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue)
![License](https://img.shields.io/badge/license-ISC-green)

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Ejecución](#-ejecución)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Scripts Disponibles](#-scripts-disponibles)
- [Base de Datos](#-base-de-datos)
- [Seguridad](#-seguridad)
- [Contribución](#-contribución)

## ✨ Características

### Sistema Bancario
- 🏦 **Cuentas Corrientes**: Apertura y gestión de cuentas bancarias
- 💰 **Sistema de Aprobación**: Flujo de solicitud y aprobación de productos
- 📊 **Dashboard Personalizado**: Vista general de productos y saldo

### Sistema de Gamificación
- 🎁 **Magys (Puntos de Recompensa)**: Acumula puntos por contratar productos
- 🎰 **Casino Virtual**: Juegos de azar (Tragamonedas)
- 🎟️ **Tickets**: Moneda del casino para canjear premios
- 🛍️ **Tienda de Premios**: Catálogo de recompensas canjeables

### Funcionalidades Adicionales
- 💬 **Chat con Magdy**: Asistente virtual inteligente con IA (Google Gemini)
- 🔐 **Autenticación Segura**: JWT con refresh tokens
- 🔒 **Seguridad Avanzada**: Rate limiting, bcrypt, helmet
- 📱 **Responsive Design**: Interfaz adaptable a todos los dispositivos

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** v18+ - Entorno de ejecución JavaScript
- **Express.js** v4.21.2 - Framework web
- **PostgreSQL** - Base de datos relacional
- **JWT** - Autenticación con tokens
- **Bcrypt** v6.0.0 - Hash de contraseñas
- **Google Generative AI** v0.24.1 - IA para chatbot
- **Helmet** - Seguridad HTTP headers
- **Express Rate Limit** - Limitación de solicitudes
- **CORS** - Control de acceso entre dominios
- **Dotenv** - Gestión de variables de entorno

### Frontend
- **React** v18.2.0 - Biblioteca de interfaces de usuario
- **Vite** v7.2.6 - Build tool y dev server
- **React Router DOM** v6.14.1 - Enrutamiento
- **Axios** v1.12.2 - Cliente HTTP
- **Tailwind CSS** v4.1.17 - Framework CSS
- **Framer Motion** v12.23.25 - Animaciones
- **React Icons** v5.5.0 - Iconos

### Base de Datos
- **PostgreSQL** v14+
- **pg** v8.13.0 - Cliente PostgreSQL para Node.js

## 📦 Requisitos Previos

Asegúrate de tener instalado:

- **Node.js** v18 o superior ([Descargar](https://nodejs.org/))
- **PostgreSQL** v14 o superior ([Descargar](https://www.postgresql.org/download/))
- **npm** o **yarn** (viene con Node.js)
- **Git** ([Descargar](https://git-scm.com/))

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/Naidess/Mago_bnk.git
cd Mago_bnk
```

### 2. Instalar dependencias del backend

```bash
npm install
```

### 3. Instalar dependencias del frontend

```bash
cd frontend
npm install
cd ..
```

## ⚙️ Configuración

### 1. Base de Datos PostgreSQL

Crea una base de datos nueva:

```sql
CREATE DATABASE mago_bank;
```

### 2. Variables de Entorno

Crea un archivo `.env` en la carpeta `backend/`:

```bash
cd backend
```

Crea el archivo `.env` con el siguiente contenido:

```env
# Database Configuration
DB_USER=postgres
DB_PASSWORD=tu_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mago_bank

# JWT Secrets (genera claves seguras aleatorias)
JWT_ACCESS_SECRET=tu_clave_secreta_access_token_muy_larga_y_segura
JWT_REFRESH_SECRET=tu_clave_secreta_refresh_token_muy_larga_y_segura

# Token Expiration
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Security
BCRYPT_SALT_ROUNDS=12
MAX_FAILED_LOGIN=5
LOCK_MINUTES=15

# CORS
CORS_ORIGIN=http://localhost:5173

# Google Gemini API (para chatbot)
GEMINI_API_KEY=tu_api_key_de_google_gemini
GEMINI_MODEL=gemini-1.5-flash

# Server
PORT=3000
NODE_ENV=development
```

**Importante**: 
- Genera claves seguras para `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET`
- Obtén tu API Key de Google Gemini en: [Google AI Studio](https://makersuite.google.com/app/apikey)

### 3. Ejecutar Migraciones

Ejecuta el script para resetear y configurar la base de datos:

```bash
cd backend
node scripts/reset_database.js
```

Esto creará todas las tablas necesarias y datos iniciales.

## 🎮 Ejecución

### Desarrollo (Modo Dev)

#### Terminal 1 - Backend:
```bash
cd backend
node app.js
```

El backend estará disponible en `http://localhost:3000`

#### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

### Producción

#### Backend:
```bash
npm start
```

#### Frontend:
```bash
cd frontend
npm run build
npm run preview
```

## 📁 Estructura del Proyecto

```
Mago_bnk/
├── backend/
│   ├── app.js                      # Aplicación Express principal
│   ├── db.js                       # Configuración de PostgreSQL
│   ├── .env                        # Variables de entorno
│   ├── controllers/                # Lógica de negocio
│   │   ├── authController.js       # Autenticación y registro
│   │   ├── userController.js       # Dashboard y perfil
│   │   ├── chatController.js       # Chatbot con IA
│   │   ├── cuentaCorrienteController.js
│   │   ├── juegoController.js      # Lógica de juegos
│   │   ├── premioController.js     # Sistema de premios
│   │   └── magysController.js      # Gestión de Magys
│   ├── routes/                     # Definición de rutas
│   │   ├── auth.js
│   │   ├── user.js
│   │   ├── chat.js
│   │   ├── cuentaCorriente.js
│   │   ├── juegos.js
│   │   ├── premios.js
│   │   └── magys.js
│   ├── middlewares/
│   │   └── authenticate.js         # Middleware de autenticación JWT
│   ├── scripts/                    # Scripts de utilidad
│   │   ├── reset_database.js       # Reset completo de BD
│   │   ├── run_migrations.js       # Ejecutar migraciones
│   │   └── cleanup_refresh_tokens.js
│   └── services/
│       └── magdyService.js         # Servicio de chatbot
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   ├── src/
│   │   ├── main.jsx                # Punto de entrada
│   │   ├── styles.css              # Estilos globales
│   │   └── api/
│   │       └── axiosInstance.js    # Cliente HTTP configurado
│   ├── components/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── ChatWithMagdy.jsx       # Componente de chat
│   │   ├── MagoLogo.jsx
│   │   └── MagysIcon.jsx
│   └── pages/
│       ├── HomePage.jsx            # Dashboard principal
│       ├── LoginPage.jsx
│       ├── RegisterPage.jsx
│       ├── JuegosMagysPage.jsx     # Lista de juegos
│       ├── TragamonedasPage.jsx    # Juego de slots
│       ├── TiendaPremiosPage.jsx   # Catálogo de premios
│       ├── SolicitarProductos.jsx  # Solicitar cuenta corriente
│       └── SettingsPage.jsx
│
├── database/
│   ├── schema.sql                  # Esquema base de datos
│   └── migrations/                 # Migraciones SQL
│       ├── 001_cuentas_corrientes_y_magys.sql
│       ├── 002_sistema_aprobacion.sql
│       └── 003_sistema_juegos_premios.sql
│
├── docs/                           # Documentación adicional
├── postman/                        # Colecciones de Postman
├── package.json
└── README.md
```

## 🌐 API Endpoints

### Autenticación
```
POST   /api/auth/register        # Registrar nuevo usuario
POST   /api/auth/login           # Iniciar sesión
POST   /api/auth/logout          # Cerrar sesión
POST   /api/auth/refresh         # Renovar access token
POST   /api/auth/reset-password  # Solicitar reset de contraseña
```

### Usuario
```
GET    /api/user/dashboard       # Obtener dashboard del usuario
```

### Cuentas Corrientes
```
POST   /api/cuentas-corrientes/solicitar     # Solicitar cuenta corriente
GET    /api/cuentas-corrientes               # Listar cuentas del usuario
POST   /api/cuentas-corrientes/:id/aprobar   # Aprobar solicitud (admin)
POST   /api/cuentas-corrientes/:id/rechazar  # Rechazar solicitud (admin)
```

### Magys
```
GET    /api/magys/saldo          # Obtener saldo de Magys
GET    /api/magys/historial      # Historial de transacciones
```

### Juegos
```
GET    /api/juegos               # Listar juegos disponibles
GET    /api/juegos/:id/simbolos  # Obtener símbolos del juego
POST   /api/juegos/slots/jugar   # Jugar tragamonedas
GET    /api/juegos/tickets       # Obtener saldo de tickets
GET    /api/juegos/historial     # Historial de jugadas
```

### Premios
```
GET    /api/premios              # Listar premios disponibles
POST   /api/premios/canjear      # Canjear premio
GET    /api/premios/canjes       # Historial de canjes
```

### Chat
```
POST   /api/chat/message         # Enviar mensaje al chatbot Magdy
GET    /api/chat/history         # Obtener historial de conversación
```

## 📜 Scripts Disponibles

### Backend

```bash
# Iniciar servidor en producción
npm start

# Iniciar servidor en desarrollo (con nodemon)
npm run dev

# Limpiar tokens expirados
npm run cleanup:tokens

# Resetear base de datos
node backend/scripts/reset_database.js

# Ejecutar migraciones
node backend/scripts/run_migrations.js

# Verificar juegos configurados
node backend/scripts/verificar_juegos.js
```

### Frontend

```bash
# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Previsualizar build de producción
npm run preview
```

## 🗄️ Base de Datos

### Tablas Principales

- **usuarios**: Usuarios registrados
- **magys**: Saldo de puntos Magys por usuario
- **cuentas_corrientes**: Cuentas bancarias
- **tickets**: Saldo de tickets del casino
- **juegos**: Catálogo de juegos disponibles
- **slot_simbolos**: Símbolos y probabilidades del tragamonedas
- **juegos_historial**: Registro de partidas jugadas
- **premios**: Catálogo de premios canjeables
- **canjes**: Historial de premios canjeados
- **mensajes**: Conversaciones con Magdy
- **refresh_tokens**: Tokens de sesión
- **auth_logs**: Auditoría de autenticación

### Diagrama de Relaciones

```
usuarios
  ├── magys (1:1)
  ├── tickets (1:1)
  ├── cuentas_corrientes (1:N)
  ├── juegos_historial (1:N)
  ├── canjes (1:N)
  ├── mensajes (1:N)
  └── refresh_tokens (1:N)

juegos
  ├── slot_simbolos (1:N)
  └── juegos_historial (1:N)

premios
  └── canjes (1:N)
```

## 🔐 Seguridad

El proyecto implementa múltiples capas de seguridad:

- **Autenticación JWT**: Access tokens (15min) y Refresh tokens (7 días)
- **Hash de contraseñas**: Bcrypt con 12 rounds de salt
- **Rate Limiting**: Límite de 200 solicitudes por minuto
- **Helmet**: Protección de headers HTTP
- **CORS**: Control de origen cruzado
- **Validación de entrada**: Express-validator
- **Bloqueo de cuenta**: Tras 5 intentos fallidos de login
- **SQL Injection**: Consultas parametrizadas con pg
- **XSS Protection**: Sanitización de inputs

### Generar claves seguras JWT

```bash
# En Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🎯 Funcionalidades Destacadas

### Sistema de Tragamonedas

- RTP (Return to Player): ~45%
- 6 símbolos diferentes con probabilidades ajustadas
- Multiplicadores desde 2x hasta 100x (Jackpot)
- Animaciones fluidas con Framer Motion
- Historial de jugadas

### Chatbot Magdy

- Powered by Google Gemini AI
- Contexto personalizado por usuario
- Información en tiempo real de saldos y cuentas
- Asistencia sobre productos bancarios

### Sistema de Premios

- Categorías: Magys, Descuentos, Digitales, Físicos
- Stock limitado en premios especiales
- Sistema de seguimiento de envíos
- Historial completo de canjes

## 🤝 Contribución

Las contribuciones son bienvenidas. Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

## 👥 Autores

- **Naidess** - [GitHub](https://github.com/Naidess)

## 🙏 Agradecimientos

- Google Gemini AI por la integración de IA
- La comunidad de React y Node.js
- Todos los contribuidores del proyecto

---

**Desarrollado con ❤️ por el equipo de Mago Bank**