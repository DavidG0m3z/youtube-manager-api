# youtube-manager-api

API REST desarrollada con **NestJS** que permite integrar videos de un canal privado de YouTube directamente en una plataforma universitaria, eliminando la necesidad de que los usuarios abandonen el sistema para acceder al contenido multimedia.

## Problema que resuelve

La plataforma virtual de la universidad tenía un flujo de UX roto: cada vez que se publicaba un video explicativo, los usuarios eran redirigidos a YouTube, perdiendo el contexto de la plataforma. Este backend resuelve ese problema sincronizando los videos del canal de YouTube directamente a la base de datos de la plataforma, permitiendo consumirlos sin salir del entorno universitario.

## Stack tecnológico

| Tecnología | Uso |
|---|---|
| NestJS 11 | Framework principal |
| TypeScript | Lenguaje |
| TypeORM | ORM |
| MySQL | Base de datos |
| JWT + Passport | Autenticación y autorización |
| Google APIs (googleapis) | OAuth2 + YouTube Data API |
| youtube-dl-exec | Descarga de videos |
| ffmpeg-static | Procesamiento de video |
| @nestjs/schedule | Tareas programadas (sync automático) |

## Características principales

- **Sincronización de videos** desde un canal privado de YouTube vía YouTube Data API
- **OAuth2 con Google** — el admin vincula su cuenta de Google para autorizar el acceso al canal privado
- **Descarga de videos** con soporte de calidad configurable y entrega como stream descargable
- **CRUD de videos** con paginación, búsqueda y filtros por resolución, FPS, sede y orientación
- **Soft delete** — los videos eliminados localmente no se re-sincronizan en futuros syncs
- **Roles de usuario** — guards de `ADMIN` protegen las operaciones sensibles
- **Sincronización manual** disponible por endpoint para admins

## Endpoints

### Auth
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/auth/register` | Registrar usuario |
| POST | `/api/v1/auth/login` | Login, retorna JWT |

### Google OAuth2
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/api/v1/google/connect` | Genera URL de autorización OAuth2 | JWT + ADMIN |
| GET | `/api/v1/google/callback` | Callback de Google, guarda tokens | — |
| GET | `/api/v1/google/account/unlink` | Desvincula cuenta de Google | JWT + ADMIN |

### Videos
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/api/v1/videos` | Listar videos (paginado + filtros) | JWT |
| GET | `/api/v1/videos/:id` | Obtener video por ID | JWT |
| POST | `/api/v1/videos/sync_manual` | Sincronizar videos desde YouTube | JWT + ADMIN |
| PATCH | `/api/v1/videos/:id` | Actualizar metadata de un video | JWT + ADMIN |
| DELETE | `/api/v1/videos/:id` | Soft delete de un video | JWT + ADMIN |

### Downloader
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/downloader/info` | Obtener info de un video por URL |
| POST | `/api/v1/downloader/download` | Iniciar descarga de un video |
| GET | `/api/v1/downloader/status/:id` | Consultar estado de una descarga |
| GET | `/api/v1/downloader/file/:id` | Descargar el archivo (stream) |

### Query params disponibles en `GET /videos`

| Param | Tipo | Descripción |
|---|---|---|
| `page` | number | Página (default: 1) |
| `limit` | number | Items por página (default: 12) |
| `search` | string | Búsqueda por texto |
| `resolution` | string | Filtrar por resolución |
| `fps` | number | Filtrar por FPS |
| `headquarters` | string | Filtrar por sede |
| `orientation` | string | Filtrar por orientación |

## Instalación y ejecución

### Prerrequisitos

- Node.js >= 18
- MySQL corriendo localmente o en Docker
- Credenciales de Google OAuth2 (Google Cloud Console)

### Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=secret
DB_NAME=youtube_manager

JWT_SECRET=
JWT_EXPIRES_IN=

YOUTUBE_API_KEY=
YOUTUBE_CHANNEL_ID=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

URL_FRONT=http://localhost:5173
```

### Pasos

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Modo producción
npm run build
npm run start:prod
```

La API queda disponible en `http://localhost:3028/api/v1`.

## Flujo de sincronización

```
Admin hace login
    → GET /google/connect  (obtiene URL de OAuth2)
    → Autoriza en Google
    → Google redirige a /google/callback
    → Se guardan los tokens en BD

Admin ejecuta sync
    → POST /videos/sync_manual
    → Se obtienen todos los videos del canal vía YouTube Data API
    → Se filtran los videos con soft delete previo
    → Se hace upsert en la BD local
```

## Estructura del proyecto

```
src/
├── modules/
│   ├── auth/          # Registro, login, JWT strategy, guards
│   ├── google/        # OAuth2 con Google, gestión de tokens
│   ├── videos/        # CRUD de videos, sync, repositorio, DTOs, mapper
│   ├── youtube/       # Llamadas a YouTube Data API
│   └── downloader/    # Descarga de videos con youtube-dl-exec
├── common/
│   ├── guards/        # RoleGuard
│   └── decorators/    # @Roles()
└── main.ts
```

## Arquitectura de autenticación

- Registro y login con hash de contraseña via **bcrypt**
- Tokens **JWT** firmados con payload `{ sub, email, role }`
- Guard de roles (`RoleGuard`) para proteger rutas de `ADMIN`
- Tokens de Google (access + refresh) almacenados en la entidad `User`, con renovación automática cuando expiran
