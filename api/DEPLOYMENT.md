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
| `JWT_EXPIRES_IN_HOURS` | no | `12` |

\* O bien `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`.

## Docker

```bash
cd api
docker build -t estacioncafe-api .
docker run -p 3484:3484 --env-file .env estacioncafe-api
```

El contenedor aplica las migraciones pendientes al iniciar (`npm run start:prod`) y expone `GET /health`.

## Render

`api/render.yaml` define el servicio (runtime Docker, `rootDir: api`, health check `/health`).

1. New → Blueprint → seleccionar el repositorio.
2. Completar `CORS_ORIGIN` y `DATABASE_URL`; `JWT_SECRET` se genera automáticamente.
3. Deploy. Las migraciones corren en cada arranque.

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
