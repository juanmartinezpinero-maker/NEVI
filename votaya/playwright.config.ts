import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const DATABASE_URL = process.env.E2E_DATABASE_URL ?? "postgres://votaya:votaya@localhost:5432/votaya_e2e";
const env = {
  DATABASE_URL,
  DEV_SHOW_CODES: "1",
  // Solo en pruebas: permite ver el código de la cuenta admin en pantalla.
  E2E_ADMIN_DEMO_CODES: "1",
  // Los premios están ocultos por defecto; las pruebas los activan para cubrir el canje.
  REWARDS_ENABLED: "1",
  ADMIN_EMAILS: "admin@e2e.test",
  AUTH_SECRET: "e2e-secret",
  NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
  MIN_SEGMENT_VOTES: "5",
};

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"] } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    env,
    timeout: 120_000,
  },
});

export { env as e2eEnv };
