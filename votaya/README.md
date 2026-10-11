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

1. **Base de datos**: crea un proyecto en [Neon](https://neon.tech) (o Supabase) y copia la cadena de conexión *pooled*.
2. **Migraciones**: `DATABASE_URL=... npm run db:migrate` (y opcionalmente `npm run db:seed` para la demo).
3. **Email**: crea una cuenta en [Resend](https://resend.com), verifica tu dominio y genera una API key.
4. **Vercel**: importa el repositorio y en *Root Directory* elige `votaya`. Variables de entorno:
   - `DATABASE_URL`, `AUTH_SECRET` (`openssl rand -base64 32`), `NEXT_PUBLIC_SITE_URL` (p. ej. `https://votaya.app`)
   - `RESEND_API_KEY`, `MAIL_FROM` (p. ej. `VotaYa <hola@votaya.app>`), `ADMIN_EMAILS`
5. Despliega. Vercel envía el país del visitante (`x-vercel-ip-country`), que se usa para votos anónimos.

Funciona igual en cualquier hosting Node (Railway, Render, Fly.io, un VPS con `npm run build && npm start`).

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
