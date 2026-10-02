# Despliegue

## Variables de entorno

| Variable | Requerida | Ejemplo |
|---|---|---|
| `NODE_ENV` | sí | `production` |
| `PORT` | no | `3484` |
| `CORS_ORIGIN` | sí | `https://estacioncafe.example.com` (varios separados por coma) |
| `DATABASE_URL` | sí* | `postgresql://postgres:<pass>@db.<proyecto>.supabase.co:5432/postgres` |
| `DB_SSL` | con Supabase | `true` |
| `JWT_SECRET` | sí | cadena aleatoria larga (la API no arranca en producción sin ella) |
| `JWT_EXPIRES_IN_HOURS` | no | `12` (sesión con contraseña) |
| `PIN_PEPPER` | sí | cadena aleatoria larga para el hash de los PIN (la API no arranca en producción sin ella; cambiarla invalida todos los PIN) |
| `PIN_SESSION_MINUTES` | no | `30` (sesión con PIN) |

\* O bien `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`.

## Docker

```bash
cd api
docker build -t estacioncafe-api .
docker run -p 3484:3484 --env-file .env estacioncafe-api
```

El contenedor aplica las migraciones pendientes al iniciar (`npm run start:prod`) y expone `GET /health`.

## Render

`render.yaml` (raíz del repo) define los dos servicios con runtime Docker:

| Servicio | `rootDir` | Health check | Variables a completar |
|---|---|---|---|
| `estacioncafe-api` | `api` | `/health` | `CORS_ORIGIN` (URL del frontend), `DATABASE_URL` |
| `estacioncafe-web` | `frontend` | `/healthz` | `API_UPSTREAM` (URL de la API) |

1. New → Blueprint → seleccionar el repositorio.
2. Completar las variables; `JWT_SECRET` se genera automáticamente.
3. Deploy. Las migraciones de la API corren en cada arranque.

`CORS_ORIGIN` debe ser la URL pública del frontend aunque el navegador llame a la API por el proxy de nginx: el navegador sigue enviando el header `Origin`.

## Frontend (Docker)

```bash
cd frontend
docker build -t estacioncafe-web .
docker run -p 8080:8080 -e API_UPSTREAM=https://estacioncafe-api.onrender.com estacioncafe-web
```

- nginx sirve la SPA (cualquier ruta → `index.html`) y hace de proxy de `/api/` hacia `API_UPSTREAM`: el navegador ve un solo origen.
- Caché: `/assets/*` un año (nombres con hash); `index.html`, `sw.js` y el manifiesto siempre se revalidan.
- Headers: CSP (`connect-src` configurable con `CSP_CONNECT_SRC`, por defecto `'self'`), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- Para llamar a la API directo sin proxy: build con `--build-arg VITE_API_URL=https://api.example.com/api` y `CSP_CONNECT_SRC="'self' https://api.example.com"`.
- Es una PWA: se puede instalar en tabletas; el shell carga sin red y la API nunca se cachea. Las versiones nuevas se ofrecen con un aviso "Actualizar".

## Supabase

1. Crear el proyecto y copiar la cadena de conexión (Settings → Database).
2. Usarla como `DATABASE_URL` con `DB_SSL=true`.
3. Datos demo (opcional): `DATABASE_URL=... DB_SSL=true npm run seed:run` desde `api/`.

## Migraciones existentes

Si la base ya tenía tablas creadas con el SQL anterior (`supabase_database.sql.txt`), marcar `InitialSchema` como aplicada antes de correr el resto:

```sql
INSERT INTO migrations ("timestamp", name) VALUES (1790918143675, 'InitialSchema1790918143675');
```

Las migraciones posteriores conservan los datos (renombran columnas y rellenan valores).
