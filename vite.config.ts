import { execSync } from "child_process";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";

const OUT_DIR = "build";

const getCommitHash = () => {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch (error) {
    return "development";
  }
};

const COMMIT_HASH = getCommitHash();

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  build: {
    outDir: OUT_DIR,
    sourcemap: false,
  },
  define: {
    "process.env.__COMMIT_HASH__": JSON.stringify(COMMIT_HASH),
  },
  plugins: [
    nodePolyfills({
      globals: {
        Buffer: true,
      },
    }),
    react({
      babel: {
        plugins: ["@emotion/babel-plugin"],
      },
    }),
    tsconfigPaths(),
    checker({ typescript: true }),
    svgr(),
  ],
});
