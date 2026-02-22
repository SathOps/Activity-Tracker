import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const corpusToken = env.CORPUS_TOKEN || "";

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: env.SWECHA_API_BASE_URL || "https://api.corpus.swecha.org",
          changeOrigin: true,
          secure: true,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              const requestAuthHeader = proxyReq.getHeader("authorization");
              const requestPath = req.url || "";
              const isAuthRoute = requestPath.startsWith("/api/v1/auth/");

              if (!requestAuthHeader && corpusToken && !isAuthRoute) {
                proxyReq.setHeader("Authorization", `Bearer ${corpusToken}`);
              }
            });
          },
        },
      },
    },
  };
});
