import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, email: string, next = "/") {
  await page.goto(`/entrar?next=${encodeURIComponent(next)}`);
  await completeLogin(page, email);
}

async function completeLogin(page: Page, email: string) {
  await page.getByLabel("Tu email").fill(email);
  await page.getByRole("button", { name: "Recibir código" }).click();
  const code = (await page.getByTestId("dev-code").locator("strong").textContent())!.trim();
  await page.getByLabel("Código de 6 cifras").fill(code);
  await page.getByRole("button", { name: "Entrar" }).click();
}

async function completeProfile(page: Page) {
  await expect(page).toHaveURL(/\/entrar\/perfil/);
  await page.getByText("25-34").click();
  await page.getByText("Prefiero no decirlo").click();
  await page.getByLabel("País de residencia").selectOption("ES");
  await page.getByRole("checkbox", { name: /16 años o más/ }).check();
  await page.getByRole("button", { name: /a votar/ }).click();
}

test.describe.configure({ mode: "serial" });

test("portada móvil: resumen de la web y sección Encuestas a pantalla completa", async ({ page }) => {
  await page.goto("/");
  // La portada es un resumen, no el feed.
  await expect(page.getByRole("heading", { name: /El mundo opina/ })).toBeVisible();
  await expect(page.getByText(/Pregunta del día/).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tendencias hoy" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Categorías" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ranking" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Historias" })).toHaveCount(0);
  // «Encuestas» abre el feed a pantalla completa.
  await page.getByRole("navigation", { name: "Navegación inferior" }).getByRole("link", { name: "Encuestas" }).click();
  await expect(page).toHaveURL(/\/descubrir/);
  const feed = page.getByRole("region", { name: "Historias" });
  await expect(feed.getByRole("tab", { name: "Rápidas" })).toBeVisible();
  // Explorar: filtro por categoría y buscador.
  // Los temas están siempre a la vista y «Por temas» abre el selector grande.
  await expect(feed.getByRole("navigation", { name: "Filtrar por tema" }).getByRole("link", { name: "Deportes" })).toBeVisible();
  await feed.getByRole("tab", { name: "Por temas" }).click();
  await expect(feed.getByRole("heading", { name: "Elige un tema" })).toBeVisible();
  await feed.getByRole("link", { name: "Ver todas las encuestas en lista" }).click();
  await expect(page).toHaveURL(/\/encuestas/);
  await expect(page.getByRole("heading", { name: "Tendencias hoy" })).toBeVisible();
  await page.getByRole("navigation", { name: "Filtrar por categoría" }).getByRole("link", { name: "Sociedad" }).click();
  await expect(page).toHaveURL(/cat=politica/);
  await expect(page.getByRole("heading", { name: /semana laboral de 4 días/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "¿Messi o Cristiano?" })).toHaveCount(0);
  await page.goto("/encuestas");
  await page.locator("#polls-q").fill("messi");
  await page.locator("#polls-q").press("Enter");
  await expect(page).toHaveURL(/q=messi/);
  await expect(page.getByRole("heading", { name: "¿Messi o Cristiano?" })).toBeVisible();
});

test("portada escritorio: pregunta del día y encuestas populares", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("/");
  await expect(page.getByText(/Pregunta del día/).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Encuestas populares" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Historias" })).toHaveCount(0);
  await ctx.close();
});

test("voto anónimo en un duelo: resultados inmediatos, persistentes y sin doble voto", async ({ page }) => {
  await page.goto("/p/messi-o-cristiano");
  await expect(page.getByText(/demostración/).first()).toBeVisible();
  await page.getByRole("button", { name: "Votar Messi" }).click();
  await expect(page.getByText("✓ Tu voto:")).toBeVisible();
  await expect(page.getByText(/votación popular, no representativa/)).toBeVisible();
  // Compartir: bloque con todas las redes y hoja desde el botón de la cabecera.
  const shareBlock = page.getByRole("region", { name: "Compartir resultado" });
  await expect(shareBlock.getByRole("button", { name: "Compartir en Instagram" })).toBeVisible();
  await expect(shareBlock.getByRole("button", { name: "Compartir en TikTok" })).toBeVisible();
  await page.getByRole("button", { name: "Compartir", exact: true }).first().click();
  const sheet = page.getByRole("dialog", { name: "Compartir encuesta" });
  await expect(sheet.getByText("Tu voto: Messi")).toHaveCount(0);
  await expect(sheet.getByRole("button", { name: "Compartir en WhatsApp" })).toBeVisible();
  await sheet.getByRole("button", { name: "Cerrar" }).click();
  await expect(sheet).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Reta a un amigo por WhatsApp/ })).toHaveAttribute("href", /wa\.me/);
  // Tras recargar, sigue viendo resultados (no puede volver a votar).
  await page.reload();
  await expect(page.getByText("✓ Tu voto:")).toBeVisible();
  await expect(page.getByRole("button", { name: "Votar Messi" })).toHaveCount(0);
  // Desglose demográfico bloqueado hasta registrarse.
  await expect(page.getByRole("link", { name: /Regístrate gratis para verlos/ })).toBeVisible();
});

test("opción «Otra»: se escribe dentro de su casilla y se agrupa", async ({ page }) => {
  await page.goto("/p/cual-es-la-mejor-serie-de-la-historia");
  await page.getByRole("button", { name: /escribe la tuya/ }).click();
  await page.getByLabel("Escribe tu respuesta").fill("the office");
  await page.getByRole("button", { name: "Votar", exact: true }).click();
  await expect(page.getByText("✓ Tu voto:")).toBeVisible();
  // «the office» se agrupó con la entrada existente «The Office».
  await expect(page.getByText(/Tu voto: The Office/)).toBeVisible();
});

test("registro sin contraseña guarda los votos anónimos y desbloquea desgloses", async ({ page }) => {
  await page.goto("/p/playa-o-montana");
  await page.getByRole("button", { name: "Votar Playa" }).click();
  await expect(page.getByText("✓ Tu voto:")).toBeVisible();
  await page.getByRole("link", { name: /Guarda tu voto/ }).click();
  await completeLogin(page, "ana@e2e.test");
  await completeProfile(page);
  await expect(page).toHaveURL(/\/p\/playa-o-montana/);
  await expect(page.getByRole("heading", { name: "¿Qué opina cada grupo?" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Países" })).toBeVisible();
  await expect(page.getByText(/gana/).first()).toBeVisible();
  await page.goto("/perfil");
  await expect(page.getByText("¿Playa o montaña?")).toBeVisible();
  await expect(page.getByText("Votaste: Playa")).toBeVisible();
  // Puntos: 50 de bienvenida + 10 por el voto guardado.
  await expect(page.getByTestId("points-balance")).toHaveText("60");
  await expect(page.getByText("encuestas votadas")).toBeVisible();
});

test("crear pregunta → moderación por admin → publicada y encontrable", async ({ page, browser }) => {
  await login(page, "creador@e2e.test", "/crear");
  await completeProfile(page);
  await expect(page).toHaveURL(/\/crear/);
  await page.getByLabel("Pregunta").fill("¿Croquetas de jamón o de pollo?");
  await page.getByLabel("Categoría").selectOption("comida");
  await page.getByLabel("Opción 1", { exact: true }).fill("Jamón");
  await page.getByLabel("Opción 2", { exact: true }).fill("Pollo");
  await page.getByRole("button", { name: "Enviar a moderación" }).click();
  await expect(page).toHaveURL(/perfil\?propuesta=ok/);
  await expect(page.getByText("En moderación", { exact: true })).toBeVisible();

  // Un usuario normal no entra al panel.
  await page.goto("/admin");
  await expect(page).not.toHaveURL(/\/admin/);

  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await login(admin, "admin@e2e.test", "/admin/moderacion");
  await completeProfile(admin);
  await expect(admin.getByRole("heading", { name: /Croquetas de jamón o de pollo/ })).toBeVisible();
  await admin.getByRole("button", { name: /Aprobar y publicar/ }).click();
  await expect(admin.getByText("No hay preguntas pendientes")).toBeVisible({ timeout: 15_000 });
  await adminCtx.close();

  await page.goto("/buscar?q=croquetas");
  await page.getByRole("heading", { name: "¿Croquetas de jamón o de pollo?" }).click();
  await expect(page).toHaveURL(/\/p\/croquetas-de-jamon-o-de-pollo/);
  await page.getByRole("button", { name: "Jamón" }).click();
  await expect(page.getByText("100%", { exact: true })).toBeVisible();
});

test("detección de duplicados al proponer", async ({ page }) => {
  await login(page, "creador@e2e.test", "/crear");
  await page.getByLabel("Pregunta").fill("¿Coca-Cola o Pepsi?");
  await expect(page.getByText("Ya hay preguntas parecidas")).toBeVisible();
  await expect(page.getByRole("link", { name: "¿Pepsi o Coca-Cola?" })).toBeVisible();
});

test("enlace de creador: atribución de clics y votos en el panel", async ({ page, browser }) => {
  await login(page, "admin@e2e.test", "/admin/enlaces");
  await page.getByLabel("Nombre del creador").fill("Lucía TikTok");
  await page.getByLabel("Código").fill("lucia");
  await page.getByLabel("Encuesta de destino").selectOption({ label: "¿Café o té?" });
  await page.getByRole("button", { name: "Crear enlace" }).click();
  await expect(page.getByText("/r/lucia")).toBeVisible();

  const visitorCtx = await browser.newContext();
  const visitor = await visitorCtx.newPage();
  await visitor.goto("/r/lucia");
  await expect(visitor).toHaveURL(/\/p\/cafe-o-te/);
  await visitor.getByRole("button", { name: "Votar Café" }).click();
  await expect(visitor.getByText("✓ Tu voto:")).toBeVisible();
  await visitorCtx.close();

  await page.goto("/admin/enlaces");
  await expect(page.getByText("1 clics")).toBeVisible();
  await expect(page.getByText("1 votos")).toBeVisible();
  await page.goto("/admin");
  await expect(page.getByText("Atribución por enlace / creador")).toBeVisible();
  await expect(page.getByRole("cell", { name: /Lucía TikTok/ })).toBeVisible();
});

test("imágenes para compartir (Stories 9:16 y Open Graph) y metadatos", async ({ page, request }) => {
  const story = await request.get("/api/story/pepsi-o-coca-cola");
  expect(story.status()).toBe(200);
  expect(story.headers()["content-type"]).toContain("image/png");
  const buf = await story.body();
  // Cabecera PNG: ancho y alto en bytes 16-23.
  expect(buf.readUInt32BE(16)).toBe(1080);
  expect(buf.readUInt32BE(20)).toBe(1920);

  await page.goto("/p/pepsi-o-coca-cola");
  const og = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(og).toContain("/p/pepsi-o-coca-cola/opengraph-image");
  const ogRes = await request.get(new URL(og!).pathname + new URL(og!).search);
  expect(ogRes.status()).toBe(200);
  expect((await ogRes.body()).readUInt32BE(16)).toBe(1200);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /Pepsi o Coca-Cola/);
});

test("puntos por votar y canje de un premio (modo demo)", async ({ page }) => {
  await login(page, "puntos@e2e.test", "/recompensas");
  await completeProfile(page);
  await expect(page).toHaveURL(/\/recompensas/);
  await expect(page.getByTestId("points-balance")).toHaveText("50");
  // Votar suma 10 puntos por encuesta.
  const duels = ["perros-o-gatos", "cafe-o-te", "verano-o-invierno", "nike-o-adidas", "pepsi-o-coca-cola", "iphone-o-android", "real-madrid-o-barcelona", "pina-en-la-pizza", "tortilla-de-patatas-con-o-sin-cebolla", "mcdonald-s-o-burger-king"];
  for (const slug of duels) {
    await page.goto(`/p/${slug}`);
    await page.locator("button[aria-label^='Votar ']").first().click();
    await expect(page.getByText("+10 puntos")).toBeVisible();
  }
  await page.goto("/recompensas");
  await expect(page.getByTestId("points-balance")).toHaveText("150");
  const card = page.locator("article", { hasText: "Café de especialidad gratis" });
  await card.getByRole("button", { name: "Canjear" }).click();
  await expect(card.getByText(/DEMO-[A-Z0-9]{8}/)).toBeVisible({ timeout: 15_000 });
  await page.goto("/perfil");
  await expect(page.getByTestId("points-balance")).toHaveText("0");
});

test("modo historias: pantalla completa, «Otra» y paso automático a la siguiente", async ({ page }) => {
  await page.goto("/descubrir");
  const feed = page.getByRole("region", { name: "Historias" });
  await expect(feed.getByRole("tab", { name: "Rápidas" })).toBeVisible();
  const title = feed.locator("h1");
  // Ocupa toda la pantalla (salvo la barra inferior).
  const box = (await feed.boundingBox())!;
  expect(box.height).toBeGreaterThan(page.viewportSize()!.height * 0.8);

  // Primera: votar y pasar con «Siguiente».
  const first = await title.textContent();
  await feed.locator("button[data-option]").first().click();
  await expect(feed.getByText("Tu voto:")).toBeVisible();
  await feed.getByRole("button", { name: "Siguiente" }).click();
  await expect(title).not.toHaveText(first!);

  // Compartir desde el feed abre la hoja con las redes y pausa el paso automático.
  await feed.getByRole("button", { name: "Compartir esta encuesta" }).click();
  await expect(page.getByRole("dialog", { name: "Compartir encuesta" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Compartir encuesta" }).getByRole("button", { name: "Compartir en Instagram" })).toBeVisible();
  await page.getByRole("dialog", { name: "Compartir encuesta" }).getByRole("button", { name: "Cerrar" }).click();

  // Avanza hasta una pregunta con «Otra» y escribe una respuesta propia; luego pasa sola.
  for (let i = 0; i < 12; i++) {
    if (await feed.getByRole("button", { name: /escribe la tuya/ }).count()) break;
    await feed.locator("button[data-option]").first().click();
    await expect(feed.getByText("Tu voto:")).toBeVisible();
    await feed.getByRole("button", { name: "Siguiente" }).click();
  }
  const withOther = await title.textContent();
  await feed.getByRole("button", { name: /escribe la tuya/ }).click();
  await feed.getByLabel("Escribe tu respuesta").fill("Respuesta e2e");
  await feed.getByRole("button", { name: "Votar", exact: true }).click();
  await expect(feed.getByText("Tu voto:")).toBeVisible();
  await expect(title).not.toHaveText(withOther!, { timeout: 6_000 });

  // Por temas: filtra el feed por categoría.
  await feed.getByRole("tab", { name: "Por temas" }).click();
  await feed.getByRole("link", { name: "Deportes" }).click();
  await expect(page).toHaveURL(/cat=deportes/);
  await expect(page.getByRole("region", { name: "Historias" }).getByText("Deportes").first()).toBeVisible();
  await expect(page.getByRole("region", { name: "Historias" }).locator("h1")).toHaveText(/Messi|Real Madrid|Has votado todo en Deportes|mejor deporte/);
});

test("tras votar con cuenta: racha, progreso de nivel y reto por WhatsApp", async ({ page }) => {
  await login(page, "racha@e2e.test", "/p/perros-o-gatos");
  await completeProfile(page);
  await page.getByRole("button", { name: "Votar Perros" }).click();
  await expect(page.getByText("+10 puntos")).toBeVisible();
  await expect(page.getByText(/\d+ votos? para ser Opinador/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Reta a un amigo por WhatsApp/ })).toHaveAttribute("href", /wa\.me/);
  await page.reload();
  await expect(page.getByRole("link", { name: /^1d · \d+ pts$/ })).toBeVisible();
});
