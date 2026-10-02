# Plan de mejoras: acceso por PIN, privacidad de cuentas, zonas, datos demo y modo oscuro

Plan previo al desarrollo. Las decisiones de la sección 1 se tomaron con el equipo; la sección 2 es el análisis del código actual que las motiva.

---

## 1. Decisiones tomadas

| #   | Tema                    | Decisión                                                                                                                             |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Entrada del mesero      | **Solo PIN** (sin elegir nombre). El PIN identifica al usuario, así que es **único**                                                 |
| 2   | Largo del PIN           | **4 dígitos**                                                                                                                        |
| 3   | Quién usa PIN           | **Meseros y cajeros**. El admin entra con usuario y contraseña                                                                       |
| 4   | Dónde funciona el PIN   | **Solo en dispositivos autorizados** por el admin. En cualquier otro equipo se pide usuario y contraseña                             |
| 5   | Intentos fallidos       | **Nunca se bloquea** (atrasaría el servicio). Solo un **freno silencioso** por dispositivo ante ráfagas de fallos                    |
| 6   | Sesión                  | **Completo:** token solo en cookie httpOnly, revocación real, usuario inactivo rechazado al instante                                 |
| 7   | Inactividad             | **Panel de mesas: 15 s** (meseros, cajeros y el admin si entra ahí), con aviso en los últimos 5 s. **Panel admin: 15 min**           |
| 8   | Visibilidad             | **El mesero ve solo sus cuentas.** El cajero y el admin ven todas. Se aplica **en la API**, no solo en pantalla                      |
| 9   | Mesa con cuenta de otro | El mesero ve **"Ocupada · Ana"** sin montos ni detalle, y puede abrir su propia cuenta en esa mesa                                   |
| 10  | Selector de zona        | **Select con las zonas existentes + "Nueva zona…"**, que muestra un campo para escribirla                                            |
| 11  | Datos demo              | **`npm run seed:demo`** borra y regenera **30 días que terminan hoy**, siempre igual (semilla fija). Se niega a correr en producción |
| 12  | Modo oscuro             | **Sistema / Claro / Oscuro**, guardado por dispositivo. El ticket se imprime siempre en claro                                        |

---

## 2. Análisis del estado actual

| Hallazgo                                                                                                                                                 | Riesgo                                                                              | Se resuelve en                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------- |
| El JWT se guarda en `localStorage` y viaja como `Bearer` (además de la cookie)                                                                           | Un XSS puede robar la sesión                                                        | F1                                    |
| `verifyToken` solo valida la firma: un usuario **desactivado** sigue operando hasta 12 h                                                                 | Acceso de ex-empleados                                                              | F1                                    |
| `logout` borra la cookie, pero el token sigue siendo válido                                                                                              | No hay revocación                                                                   | F1                                    |
| El login no tiene ningún freno                                                                                                                           | Fuerza bruta (crítico con PIN de 4 dígitos)                                         | F1 (dispositivos autorizados + freno) |
| `GET /bills`, `GET /bills/:id` y `GET /bill-details/bill/:id` responden a **cualquier rol** con cualquier cuenta. "Solo mis cuentas" es un filtro visual | Un mesero ve y modifica cuentas ajenas                                              | F2                                    |
| `POST /bills/table/:id/close` cierra **todas** las cuentas de la mesa, sin importar el mesero                                                            | Un mesero cobra cuentas de otro                                                     | F2                                    |
| El mapa de mesas se arma con `GET /bills?status=open`                                                                                                    | Al filtrar por dueño, el mesero dejaría de ver qué mesas atienden otros             | F2 (`GET /tables/board`)              |
| El carrito se guarda por cuenta en el dispositivo                                                                                                        | Con cierre a los 15 s se pierde el contexto si no se recuerda dónde iba cada mesero | F3                                    |
| El selector de zona usa `<datalist>`; cada navegador lo pinta distinto (la "viñeta")                                                                     | UX inconsistente                                                                    | F4                                    |
| Los tokens de color ya son variables CSS; los paneles ciruela usan `white/10` a propósito                                                                | Base lista para el modo oscuro                                                      | F6                                    |
| El seeder actual crea lo mínimo (3 productos, 2 mesas)                                                                                                   | No sirve para probar reportes, dashboard ni filtros                                 | F5                                    |

---

## 3. Diseño

### 3.1 Autenticación (API)

**Dispositivos autorizados**

- Nueva tabla `devices`: `id`, `name`, `token_hash` (SHA-256), `active`, `created_by`, `last_seen_at`.
- El admin, con sesión iniciada **en la tablet**, entra a _Dispositivos → Autorizar este dispositivo_. La API genera 32 bytes aleatorios y los entrega en la cookie httpOnly `device_token`, de larga duración. En la base solo se guarda el hash.
- El admin puede ver, renombrar y revocar dispositivos. Al revocar uno, deja de aceptar PIN de inmediato.

**PIN**

- Columna `users.pin_hash` con índice único: **HMAC-SHA256(PIN, `PIN_PEPPER`)**.
  - Un hash determinista permite buscar al usuario por su PIN y garantizar que sea único.
  - El _pepper_ vive solo en la configuración: sin él, la base filtrada no sirve para adivinar PINs.
- Solo meseros y cajeros tienen PIN. El admin lo **genera** (aleatorio y único) o lo escribe; si choca con otro, la API responde 409.
- `POST /auth/pin { pin }`: exige un `device_token` válido. Si no lo hay, responde 403 "Este dispositivo no está autorizado para PIN".
- **Freno silencioso:** con más de 10 fallos en 60 s desde el mismo dispositivo, cada fallo extra tarda 1 s más, hasta 3 s. Nunca se bloquea.

**Sesiones**

- Nueva tabla `sessions`: `id` (jti), `user_id`, `device_id`, `method` (pin|password), `expires_at`, `revoked_at`, `last_seen_at`.
- El JWT lleva `jti` y viaja **solo** en la cookie httpOnly `auth_token` (`SameSite=Strict`). Las respuestas de login dejan de incluir el token.
- En cada petición se verifica la firma, que la sesión no esté revocada ni vencida, y que el usuario esté activo y conserve su rol. Esto exige una consulta a la base por petición, con `last_seen_at` escrito como mucho cada 30 s.
- Duración: **PIN 30 min**, **contraseña 12 h**. El cierre por inactividad lo hace el cliente.
- Se revocan sesiones al: cerrar sesión; desactivar al usuario (todas); cambiar su PIN o contraseña (todas); cambiarle el rol (todas); revocar el dispositivo (las de ese dispositivo).
- **CSRF:** con la cookie como único medio, los métodos que modifican datos exigen el header `X-Requested-With: EstacionCafe`. Un sitio externo no puede enviarlo sin un preflight de CORS, que se rechaza.
- `Authorization: Bearer` se mantiene solo para pruebas y scripts (Swagger y e2e de API). El navegador ya no lo usa.

### 3.2 Visibilidad de cuentas (API)

- Regla única en `BillAccess`: el mesero solo accede a cuentas con `waiterId === user.userId`. El cajero y el admin, a todas.
- Afecta a:
  - `GET /bills`: para el mesero se fuerza `waiterId`.
  - `GET /bills/:id`, `PUT`, `POST /:id/void`, `GET /bill-details/bill/:id`, `POST/PATCH/DELETE /bill-details`: un mesero sobre una cuenta ajena recibe **404** (no 403, para no revelar que existe).
  - `POST /bills/table/:id/close`: el mesero solo cierra **sus** cuentas de esa mesa. Si quedan cuentas de otros, la mesa sigue ocupada.
  - `GET /bills/date-range`, `/customer/:c` y `/table/:t`: mismas reglas.
- Nuevo `GET /tables/board`: cada mesa con `attendedBy: [{ waiterId, username }]` (quién atiende) y `mine: { bills, total }` (solo lo propio). El cajero y el admin reciben también `all: { bills, total }`.
- `GET /reports/sales` sigue siendo solo del admin.

### 3.3 Frontend

- **Login:** si el dispositivo está autorizado (`GET /auth/device` responde `{ authorized, name }`), se muestra el **teclado de PIN** a pantalla completa con un enlace "Entrar con usuario". Si no, el formulario de usuario y contraseña.
  - Teclado táctil de 4 dígitos: al completar el 4.º dígito se envía solo, sin botón ✓. Un error vibra y limpia el PIN sin bloquear.
- **Sesión:** se quita el token del store y de `localStorage`. El store guarda solo el usuario; al cargar, `GET /users/me` confirma la sesión. `fetch` usa `credentials: 'include'` y el header `X-Requested-With`.
- **Inactividad:** el hook `useIdleLogout(ms)` escucha toques, teclado, clic y scroll. Panel de mesas y ticket: 15 s; panel admin: 15 min.
  - En los últimos 5 s aparece un aviso a pantalla completa con cuenta regresiva; cualquier toque lo cancela.
  - Al cerrar por inactividad se guarda la **última ruta por usuario**. Si el **mismo** mesero vuelve a entrar, regresa a donde estaba, con el carrito intacto. Si entra otro, va a su inicio.
  - En cada cambio de usuario se limpia toda la caché de datos.
- **Mapa de mesas:** usa `/tables/board`. Una mesa propia muestra cuentas y total; una ajena, "Ocupada · Ana" sin montos. El detalle de la mesa lista solo mis cuentas, con la nota "También atiende: Ana".
- **Usuarios (admin):** para mesero y cajero hay una sección PIN (Generar / Escribir). El PIN se ve **una sola vez** al guardarlo.
- **Dispositivos (admin):** nueva vista con la lista, renombrar, revocar y "Autorizar este dispositivo".
- **Zona:** `ZoneSelect` = `Select` con las zonas existentes y "+ Nueva zona…"; al elegir esta última aparece un `Input` con foco. Se usa al crear y editar mesas.
- **Modo oscuro:**
  - Tokens `.dark` sobre los de `:root`, con contraste AA verificado con axe.
  - Variante Tailwind `@custom-variant dark`.
  - Store `theme: system|light|dark` y `public/theme-init.js`, que aplica la clase antes de pintar (la CSP prohíbe scripts inline). También actualiza `theme-color`.
  - Selector en Perfil y botón rápido en las barras.
  - Ticket, `@media print` y splash quedan siempre en claro.

### 3.4 Seeds de un mes (`npm run seed:demo`)

- Generador con semilla fija (mulberry32): siempre los mismos datos, con fechas relativas a hoy (hora de El Salvador).
- **Catálogo:**
  - 6 proveedores (uno inactivo) y 6 tipos de consumible.
  - ~25 consumibles con costos por g/ml y stock mínimo.
  - 6 categorías y ~35 productos con receta, varios inactivos.
- **Operación:**
  - 14 mesas en 3 zonas y 3 cajas (una inactiva).
  - Usuarios: 1 admin, 5 meseros y 2 cajeros con PIN conocido, más 1 inactivo. Además siguen existiendo `admin.demo`, `mesero.demo` y `cajero.demo`.
- **30 días de ventas:**
  - 40–90 cuentas por día según el día de la semana, en horario de 7:00 a 20:00 y con horas pico.
  - 70 % en mesa y 30 % para llevar; productos con popularidad ponderada.
  - Estados en días pasados: `closed` y `finished`, más ~2 % `void`.
  - **Hoy:** cuentas `open` en varias mesas y de varios meseros, `draft` recientes y para llevar en las tres etapas.
- **Compras:** semanales por proveedor, con detalle calculado para cubrir el consumo, más algunos gastos sin inventario.
- **Stock coherente:** se calcula como stock inicial + compras − consumo por receta, en orden cronológico; nunca queda negativo. Algunos consumibles terminan bajo el mínimo para probar las alertas.
- **Inserción:** en lote y en una transacción; totales, `unitPrice` y `subTotal` iguales a los que calcularía la API.
- Antes de insertar, vacía todas las tablas (igual que las pruebas de integración). Aborta si `NODE_ENV=production`.

---

## 4. Fases

| Fase                                                           | Contenido                                                                                                                                                                                                                 | Hecho cuando                                                                                                                      |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **F1. Sesiones seguras + PIN (API)**                           | Tablas `sessions`, `devices` y `users.pin_hash` (migración); `TokenService` con `jti`; middleware con sesión, usuario activo y CSRF; `POST /auth/pin`; endpoints de dispositivos; freno silencioso; revocaciones; OpenAPI | Integración: PIN solo en dispositivo autorizado, PIN único, usuario desactivado → 401 inmediato, logout revoca, freno sin bloqueo |
| **F2. Privacidad de cuentas (API)**                            | `BillAccess` en servicios y controladores, `/tables/board`, cierre de mesa por dueño                                                                                                                                      | Integración: mesero A no lee ni modifica cuentas de B (404); cajero sí; la mesa compartida sigue ocupada                          |
| **F3. Login con PIN, sesión por cookie e inactividad (front)** | Cliente con cookies, store sin token, teclado PIN, `useIdleLogout` con aviso, última ruta por usuario, vista de dispositivos, PIN en usuarios                                                                             | Unitarias y e2e: autorizar dispositivo → PIN → 15 s → aviso → cierre → mismo mesero vuelve a su orden                             |
| **F4. Mapa de mesas privado + selector de zona**               | Mapa y detalle con `/tables/board`, "Ocupada · Ana", `ZoneSelect`                                                                                                                                                         | Flujo: el mesero no ve montos ajenos; zona nueva o existente sin `datalist`                                                       |
| **F5. Seeds de un mes**                                        | `seed:demo` (generador, catálogo, ventas, compras, stock)                                                                                                                                                                 | Corre en < 30 s; los reportes del mes cuadran con las facturas; stock ≥ 0; hay cuentas en los 5 estados                           |
| **F6. Modo oscuro**                                            | Tokens, variante, store, `theme-init.js`, selector y botón                                                                                                                                                                | axe AA en claro y oscuro; sin parpadeo al cargar; el ticket se imprime en claro                                                   |
| **F7. Cierre**                                                 | e2e completos, docs (API, despliegue, README), regenerar orval                                                                                                                                                            | Todas las suites en verde y la documentación al día                                                                               |

El orden importa: F2 depende de la sesión de F1 (`req.user` confiable), y F3 y F4 consumen los endpoints nuevos. F5 y F6 son independientes y van al final.

---

## 5. Riesgos y mitigaciones

| Riesgo                                                                       | Mitigación                                                                                                                 |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Cerrar sesión a los 15 s puede cortar a un mesero que está pensando la orden | Aviso de 5 s cancelable con un toque; el carrito se conserva y el mismo mesero vuelve a donde estaba                       |
| Un PIN único de 4 dígitos sin bloqueo                                        | Solo funciona en dispositivos autorizados; freno silencioso; hash con pepper; el admin puede revocar el dispositivo        |
| Pasar a sesión por cookie rompe a quien use `Bearer`                         | Bearer se mantiene para scripts y pruebas; el frontend se migra en la misma rama                                           |
| Una consulta extra por petición para validar la sesión                       | Índice por `jti`; `last_seen_at` se escribe como mucho cada 30 s                                                           |
| La mesa compartida cambia el contrato de cierre                              | Se documenta en OpenAPI; cajero y admin siguen cerrando todo                                                               |
| El seed sobre la BD local borra datos actuales                               | Es un comando separado, explícito, con aviso, y se niega en producción                                                     |
| `PIN_PEPPER` nuevo en producción                                             | Validado por el esquema de env (obligatorio en producción); documentado en DEPLOYMENT.md y `render.yaml` (`generateValue`) |
