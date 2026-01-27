import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3001,
      host: "0.0.0.0",
      watch: {
        usePolling: true,
      },
    },
    plugins: [
      reactRouter(),
      tsconfigPaths(),
    ],
    optimizeDeps: {
      include: ["react", "react-dom", "react-router"],
    },
    ssr: {
      noExternal: [/^recharts/, /^d3-/, /^vic-/, "lucide-react", "clsx", "tailwind-merge"],
    },
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./app"),
      },
    },
  };
});
