import { defineConfig, devices } from "@playwright/test";

// E2E spot-check against a scoreboard instance started by scripts/run-loadtest.sh
// with KEEP=1 (or any externally running scoreboard).
//
//   KEEP=1 ./scripts/run-loadtest.sh -- -bouts=5 -skip-flow
//   cd frontend && npx playwright test
//
// Override base URL via SCOREBOARD_URL env var.
const baseURL = process.env.SCOREBOARD_URL ?? "http://localhost:8080";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // judges share server state; serialize specs
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
