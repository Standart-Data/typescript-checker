import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],

    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
    ],

    environment: "node",

    coverage: {
      provider: "v8",
      include: ["src/**/*.{js,ts}"],
      exclude: [
        "src/**/*.{test,spec}.{js,ts}",
        "src/**/tests/**",
        "src/**/__tests__/**",
      ],
      reporter: ["text", "json", "html"],
    },

    testTimeout: 10000,
    hookTimeout: 10000,

    globals: false,

    reporter: ["verbose"],

    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1,
      },
    },
  },
});
