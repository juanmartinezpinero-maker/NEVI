# VotaYa — El mundo opina. ¿Y tú?

Plataforma web para votar preguntas divertidas y polémicas, ver al instante qué opina el mundo y compartir el resultado.
MVP funcional: portada, votación (duelos, multiopción y «Otra» con agrupación), registro sin contraseña, resultados por país/edad/género,
creación de preguntas con moderación, imágenes para Stories, enlaces de creadores, analítica y panel de administración.

> Las encuestas incluidas son **de demostración**: sus votos son **ficticios** y se identifican como tales en la interfaz.

## Stack

| Capa | Elección | Motivo |
| --- | --- | --- |
| Web | Next.js 16 (App Router, Server Actions) + React 19 + TypeScript | SEO, rendimiento, una sola base de código front/back |
| Estilos | Tailwind CSS 4 | Rápido de iterar, mobile-first |
| Base de datos | PostgreSQL + Drizzle ORM | Relacional, barato, escalable (Neon / Supabase / RDS) |
| Local sin instalar nada | PGlite (Postgres embebido en `.data/`) | `npm run dev` funciona sin servidor de BD |
| Auth | Código de 6 cifras por email (Resend), sesión en cookie httpOnly | Sin contraseñas, registro < 30 s |
| Imágenes sociales | `next/og` (Open Graph 1200×630 y Stories 1080×1920) | Sin servicios externos |
| Pruebas | Vitest (lógica + integración con Postgres) y Playwright (E2E móvil) | |

## Ejecutar en local

Requisitos: Node.js 20.9+.

```bash
cd votaya
npm install
cp .env.example .env.local     # ajusta ADMIN_EMAILS con tu email
npm run db:seed                # crea la BD local (PGlite) y carga encuestas demo
npm run dev                    # http://localhost:3000
```

- Sin `RESEND_API_KEY`, el código de acceso **se muestra en pantalla y en la consola** (solo en desarrollo).
- Entra con un email listado en `ADMIN_EMAILS` para ver el **panel de administración** en `/admin`.
- Para usar un Postgres real en local, define `DATABASE_URL` y ejecuta `npm run db:migrate && npm run db:seed`.
- Ejecuta `db:seed` con el servidor parado cuando uses PGlite (la base embebida admite un solo proceso).

## Pruebas

```bash
npm run typecheck && npm run lint
npm test                                                        # pruebas unitarias
TEST_DATABASE_URL=postgres://user:pass@localhost:5432/votaya_test npm test   # + integración del motor de votos
npm run build && npm run test:e2e                               # E2E (necesita Postgres, ver playwright.config.ts)
```

Las E2E usan `E2E_DATABASE_URL` (por defecto `postgres://votaya:votaya@localhost:5432/votaya_e2e`), **borran esa base**,
aplican migraciones y cargan los datos demo. Si Playwright no encuentra navegador, indica uno con `PW_CHROMIUM_PATH`.

## Desplegar (recomendado: Vercel + Neon + Resend)

1. **Base de datos**: crea un proyecto en [Neon](https://neon.tech) (región Europa) y copia la cadena de conexión.
2. **Vercel**: *Add New → Project*, importa el repositorio y en *Root Directory* elige `votaya`.
   Tras crearlo, en *Settings → Git → Production Branch* pon la rama donde está VotaYa (`votaya-mvp` mientras no se fusione).
3. **Variables de entorno** (*Settings → Environment Variables*):

| Variable | Valor |
| --- | --- |
| `DATABASE_URL` | cadena de conexión de Neon |
| `AUTH_SECRET` | texto aleatorio largo (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_SITE_URL` | URL pública, p. ej. `https://votaya.vercel.app` |
| `ADMIN_EMAILS` | tu email (tendrás acceso a `/admin`) |
| `SEED_DEMO` | `1` para cargar las encuestas demo la primera vez |
| `DEV_SHOW_CODES` | `1` solo para demos sin email: muestra el código en pantalla (nunca a cuentas admin) |
| `REWARDS_ENABLED` | `1` para mostrar la sección de Premios (oculta por defecto) |
| `RESEND_API_KEY`, `MAIL_FROM` | envío real de códigos ([Resend](https://resend.com)); necesario para entrar como admin |

4. **Deploy**. El script `vercel-build` aplica las migraciones (y la demo si `SEED_DEMO=1`) antes de compilar.

Para el lanzamiento público: verifica un dominio en Resend, configura `MAIL_FROM` con él y quita `DEV_SHOW_CODES`.
Funciona igual en cualquier hosting Node (Railway, Render, Fly.io, VPS con `npm run build && npm start`).

## Estructura

```
votaya/
├─ drizzle/            migraciones SQL generadas (npm run db:generate)
├─ scripts/            migrate.ts, seed.ts (datos demo ficticios)
├─ assets/fonts/       Inter (OFL) para las imágenes generadas
├─ src/
│  ├─ app/             páginas y rutas (App Router)
│  │  ├─ actions/      Server Actions: votar, auth, crear, admin
│  │  ├─ admin/        panel: resumen, moderación, encuestas, creadores, usuarios
│  │  ├─ api/          track (analítica), story (imagen 9:16), me/export (RGPD)
│  │  ├─ p/[slug]/     página de encuesta + imagen Open Graph
│  │  └─ r/[code]/     enlaces de creadores con atribución
│  ├─ components/      PollVoter, ShareBar, PollCard, SegmentTabs…
│  ├─ db/              esquema Drizzle y conexión (Postgres o PGlite)
│  ├─ lib/             votos, encuestas, auth, antifraude, analítica, texto
│  └─ proxy.ts         cookie anónima de dispositivo y ?ref= de atribución
└─ tests/              unit/ (Vitest) y e2e/ (Playwright)
```

## Decisiones clave

- **Un voto por persona y encuesta**: índice único `(poll_id, voter_key)`, donde `voter_key` es `u:<usuario>` o `a:<dispositivo>`.
  Al registrarse, los votos anónimos del dispositivo pasan a la cuenta (sin duplicar).
- **Antifraude**: límites por hash de IP (global y por encuesta), máximo de votos anónimos por dispositivo antes de pedir registro
  (`ANON_VOTE_LIMIT`), límites de códigos por email/IP, honeypot en el login y panel de IPs sospechosas.
  Las IP nunca se guardan en claro (hash con sal secreta).
- **Votos verificados vs. anónimos**: todos cuentan en la votación popular; los desgloses por país/edad/género solo usan votos de
  cuentas verificadas y grupos con un mínimo de votos (`MIN_SEGMENT_VOTES`).
- **Popular vs. estudio**: cada encuesta tiene `kind` (`popular` | `study`); hoy todas son populares y se avisa de que no son representativas.
- **«Otra»**: el texto se normaliza (tildes, mayúsculas, artículos, plurales, erratas) y se asigna a una opción existente o a un grupo
  de respuestas; el admin puede convertir un grupo en opción oficial, unirlos u ocultarlos.
- **Monetización preparada, no activada**: tablas `sponsors` y `campaigns`, campo `sponsor_id` en encuestas (se muestran como
  «Patrocinada»), página `/empresas` con lista de espera. Sin pagos ni recompensas.

Ver [INFORME.md](./INFORME.md) para el estado de funcionalidades, pendientes y costes.
