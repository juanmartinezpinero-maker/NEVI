# Informe del MVP de voppi!

Fecha: 11/10/2026 · Rama: `votaya-mvp` · Carpeta: `votaya/`

## 1. Qué está terminado y probado

Leyenda de verificación: **E2E** = cubierto por Playwright en navegador móvil emulado (Pixel 7) contra Postgres;
**INT** = prueba de integración contra Postgres real; **UNIT** = prueba unitaria; **MANUAL** = revisado con capturas.

| Área | Funcionalidad | Verificación |
| --- | --- | --- |
| Portada | Pregunta del día (votable sin salir de la portada), tendencias, categorías, ranking de países, últimas preguntas, buscador, bloque de patrocinadas | E2E + MANUAL |
| Votación | Duelos 2 opciones con «VS», encuestas de 3 a 10 opciones, resultados instantáneos con barras animadas y porcentajes que suman 100 | E2E + UNIT |
| Votación | «Otra» escrita dentro de su casilla; agrupa variantes («the office» = «The Office», plurales, erratas); si coincide con una opción, suma a esa opción | E2E + INT + UNIT |
| Votación | Un voto por persona y encuesta (también tras registrarse), sin voto doble al recargar | E2E + INT |
| Antifraude | Límite por IP y encuesta, límite global por IP, registro obligatorio tras 10 votos anónimos, límite de códigos por email/IP, honeypot, panel de IPs sospechosas | INT + MANUAL |
| Resultados | Desglose por país, edad y género solo con votos verificados y muestra mínima; bloqueado (con aviso) para no registrados | E2E + INT |
| Resultados | Distinción «Votación popular» / «Estudio representativo» y avisos de no representatividad | MANUAL |
| Registro | Email + código de 6 cifras sin contraseña; perfil con franja de edad, género (con «prefiero no decirlo»), país y consentimientos | E2E |
| Registro | Explorar y votar sin cuenta; al registrarse, los votos anónimos se guardan en la cuenta | E2E + INT |
| Privacidad | Cookies solo técnicas, IP con hash, descarga de datos (JSON), borrado de cuenta con anonimización de votos, borradores de privacidad y condiciones | MANUAL |
| Viralización | URL propia por encuesta, Open Graph dinámico 1200×630, imagen 9:16 para Stories, compartir nativo (con imagen en móvil), WhatsApp, X, Telegram, Facebook, copiar enlace | E2E |
| Viralización | Enlaces de creadores `/r/<código>` y `?ref=`: clics, visitas, votos y registros atribuidos | E2E |
| Creación | Usuarios registrados proponen preguntas (categoría, opciones, emojis, imágenes por URL, «Otra»), detección de duplicados en vivo, límite 5/día | E2E |
| Moderación | Cola de moderación con aviso de duplicados, aprobar / rechazar con motivo (el autor lo ve en su perfil) | E2E |
| Gamificación | Rankings hoy / semana / histórico, países que más votan, historial personal, recomendaciones según categorías favoritas, «Siguiente pregunta» y modo Descubrir | E2E (historial) + MANUAL |
| Admin | KPIs, embudo visita→voto→registro, retención D1 / D1-7, votos por día, atribución por creador, canales de compartido, orígenes, actividad sospechosa | E2E + MANUAL |
| Admin | Destacar pregunta del día, publicar/archivar/eliminar, editar título, gestionar respuestas «Otra» (convertir en opción, unir, ocultar), roles de usuario, lista de espera de marcas | E2E (parcial) + MANUAL |
| SEO / rendimiento | Metadatos por página, `sitemap.xml`, `robots.txt`, fuentes optimizadas, páginas en servidor (HTML completo) | MANUAL |
| Accesibilidad | Navegación por teclado, foco visible, `aria-live` en resultados, roles de pestañas, «saltar al contenido», respeto a `prefers-reduced-motion` | MANUAL (sin auditoría formal) |

Resultado de la última ejecución: `tsc` sin errores, ESLint sin avisos, `next build` correcto,
**17 pruebas unitarias/integración** y **8 pruebas E2E** en verde.

## 1b. Versión 2 (rediseño)

| Área | Funcionalidad | Verificación |
| --- | --- | --- |
| Diseño | Estilo claro con fotos: cabecera con pestañas (Inicio, Encuestas, Rankings, Tendencias, Premios), héroe morado, tarjetas con dos fotos y porcentajes, barra lateral con tendencias, ranking de países y comunidad | MANUAL (capturas) |
| Encuestas | Página con todas las encuestas, filtro por categoría (incluye Política y sociedad y Productos), buscador, orden (más votadas, nuevas, tendencia) y «Cargar más» | E2E |
| Rankings / Tendencias | Ranking histórico, semanal y diario con filtro por categoría; tendencias del día y de la semana | MANUAL |
| Puntos | +10 por encuesta votada (una vez por encuesta), +50 al registrarse, +100 si se publica tu pregunta, tope de 200 al día; solo cuentas verificadas | INT + E2E |
| Perfil | Contador de encuestas votadas, saldo de puntos, nivel (Novato → Leyenda) con barra de progreso, movimientos | E2E |
| Premios | Catálogo de premios de marcas patrocinadoras ligados a encuestas, canje atómico (saldo, stock, código), historial de canjes; panel admin para crear premios, pausar y marcar entregas o devolver puntos | INT + E2E |
| Fotos | 28 fotos realistas generadas con IA (sin logos ni personas reales), alojadas en Higgsfield | MANUAL |

**Importante sobre premios reales**: en esta versión todo funciona en **modo demostración** (marcas ficticias, cupones sin valor).
Antes de activar premios reales (`REWARDS_MODE=live`) hace falta: acuerdo con cada marca, bases legales de la promoción
(en España, promociones con premio requieren bases y revisar fiscalidad de premios), y reforzar el antifraude (teléfono verificado,
detección de cuentas duplicadas) porque los puntos pasan a tener valor.

## 2. Pendiente o solo preparado

| Tema | Estado | Siguiente paso |
| --- | --- | --- |
| Vídeos verticales para Reels/TikTok | Preparado: la imagen 9:16 ya se genera en servidor | Generar MP4 con barras animadas (Remotion o ffmpeg en una cola de trabajos) |
| Subida de imágenes | Solo URLs https | Almacenamiento (Vercel Blob / S3 / Supabase Storage) con moderación de imágenes |
| Monetización | Solo modelo de datos (`sponsors`, `campaigns`), etiqueta «Patrocinada» y lista de espera | Panel de empresas, presupuesto, segmentación, informes. **Sin pagos ni recompensas** hasta validación legal, económica y antifraude |
| Estudios representativos | Campo `kind = study` y etiqueta | Ponderación por cuotas (país/edad/género) y metodología publicada |
| Antifraude avanzado | Reglas básicas | Captcha invisible (Turnstile) ante picos, detección de emails desechables, revisión de votos por IP sospechosa |
| Rate limiting | En Postgres (suficiente para el MVP) | Redis (Upstash) si el tráfico crece |
| Idiomas | Interfaz en español | i18n (inglés, portugués) para la expansión internacional |
| Textos legales | Borradores | Revisión por un abogado (RGPD / LOPDGDD), registro de actividades de tratamiento |
| Notificaciones | — | Email semanal opcional con las preguntas más virales |
| Analítica | Propia, en Postgres | Exportación a una herramienta de producto (PostHog/Amplitude) si se necesita más análisis |
| Accesibilidad | Buenas prácticas aplicadas | Auditoría WCAG 2.2 AA con lector de pantalla |

## 3. Costes estimados de infraestructura

Precios orientativos de planes públicos; **conviene confirmarlos antes de contratar**, porque cambian.

| Fase | Tráfico aprox. | Hosting (Vercel) | Base de datos (Neon/Supabase) | Email (Resend) | Total mensual aprox. |
| --- | --- | --- | --- | --- | --- |
| Pruebas / beta cerrada | < 5.000 visitas/mes | 0 € (Hobby; solo uso no comercial) | 0 € (plan gratuito) | 0 € (≈3.000 emails/mes) | **0 €** + dominio (~15 €/año) |
| Lanzamiento | ~100.000 visitas, ~300.000 votos/mes | ~20 $ (Pro) | ~20-25 $ | 0-20 $ | **~40-65 €/mes** |
| Crecimiento viral | ~2 M visitas, ~5 M votos/mes | 20 $ + consumo (~50-150 $) | ~70-150 $ | ~20-90 $ | **~150-400 €/mes** |

Notas:
- Un pico viral cuesta sobre todo en funciones de servidor y lecturas de BD; la siguiente optimización sería cachear portada y
  rankings unos segundos y precomputar contadores.
- Alternativa más económica a escala: un VPS (Hetzner ~10-40 €/mes) con Postgres propio, a cambio de más mantenimiento.

## 4. Cómo verlo funcionando

1. `cd votaya && npm install && cp .env.example .env.local`
2. Pon tu email en `ADMIN_EMAILS` dentro de `.env.local`
3. `npm run db:seed && npm run dev` y abre http://localhost:3000
4. El código de acceso aparece en pantalla mientras no haya `RESEND_API_KEY`.
