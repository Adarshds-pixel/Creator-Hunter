import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Real Gemini calls (search parsing, outreach generation) and
    // mongodb-memory-server startup both routinely exceed vitest's 5s
    // default outside a warm cache/fast network.
    testTimeout: 60000,
    hookTimeout: 30000,
    // Test files each make live Gemini calls and spin up their own
    // mongodb-memory-server instance — running them in parallel makes both
    // contend (API latency, binary download) and pushes real calls past
    // even a generous per-test timeout. One file at a time is reliable.
    fileParallelism: false,
  },
});
