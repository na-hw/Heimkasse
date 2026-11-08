import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: { modules: { classNameStrategy: "non-scoped" } },
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "html"],
      // Critical logic: storage, migrations, calculations, parsing, formatting, import, backup, lock.
      // UI glue (components, hooks, stores) and Tauri-only code are covered by the E2E tests.
      include: ["src/lib/**/*.ts", "src/features/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "**/hooks.ts",
        "**/store.ts",
        "**/*Store.ts",
        "**/components/**",
        "src/features/queryKeys.ts",
        "src/features/shared/use*.ts",
        "src/lib/**/use*.ts",
        "src/lib/db/runtime.ts",
        "src/lib/files/runtime.ts",
        "src/lib/db/adapters/sqlite/tauriExecutor.ts",
        "src/lib/files/TauriFileStore.ts",
        "src/lib/export/saveFile.ts",
        "src/lib/export/renderPdf.ts",
        "src/lib/utils/notify.ts",
        "src/lib/preferences/bootCache.ts",
      ],
      thresholds: { lines: 90, statements: 90, functions: 85, branches: 80 },
    },
  },
});
