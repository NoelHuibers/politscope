import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./src/paraglide",
      strategy: ["url", "cookie", "baseLocale"],
      emitTsDeclarations: true,
    }),
    tanstackStart({
      srcDirectory: "src",
      router: {
        routesDirectory: "./routes",
        generatedRouteTree: "./routeTree.gen.ts",
      },
    }),
    viteReact(),
    nitro(),
  ],
});
