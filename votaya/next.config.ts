import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: path.join(__dirname) },
  // PGlite (Postgres embebido para desarrollo local) usa WASM y no debe empaquetarse.
  serverExternalPackages: ["@electric-sql/pglite"],
  poweredByHeader: false,
  // Fuentes leídas en tiempo de ejecución por las imágenes para compartir.
  outputFileTracingIncludes: { "/**": ["./assets/fonts/**"] },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
