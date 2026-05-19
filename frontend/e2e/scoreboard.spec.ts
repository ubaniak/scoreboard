import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";

// Smoke spot-check: confirm public scoreboard renders and a judge code works.
// Assumes server seeded by cmd/loadtest with -creds-out, e.g.:
//   KEEP=1 ./scripts/run-loadtest.sh -- -bouts=5 -skip-flow
// then in another shell:
//   export SCOREBOARD_CREDS=/tmp/scoreboard-loadtest-XXXX/creds.json
//   cd frontend && npx playwright test

type Creds = {
  base: string;
  cardId: number;
  cardName: string;
  adminCode: string;
  judgeCodes: Record<string, string>;
};

function loadCreds(): Creds {
  const path = process.env.SCOREBOARD_CREDS;
  if (!path) {
    throw new Error("SCOREBOARD_CREDS env var must point at creds.json from loadtest");
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

test("public scoreboard page renders", async ({ page }) => {
  const creds = loadCreds();
  await page.goto("/scoreboard");
  await expect(page.locator("body")).toContainText(new RegExp(creds.cardName, "i"), {
    timeout: 10_000,
  });
});

test("judge code authenticates and returns a token", async ({ request }) => {
  const creds = loadCreds();
  const judgeCode = creds.judgeCodes["judge1"];
  expect(judgeCode, "judge1 code missing from creds").toBeTruthy();

  const resp = await request.post("/api/login", {
    data: { role: "judge1", code: judgeCode },
  });
  expect(resp.ok()).toBeTruthy();
  const body = await resp.json();
  expect(body.data, "expected JWT in data field").toBeTruthy();
});

test("admin can list bouts on the seeded card", async ({ request }) => {
  const creds = loadCreds();
  const loginResp = await request.post("/api/login", {
    data: { role: "admin", code: creds.adminCode },
  });
  expect(loginResp.ok()).toBeTruthy();
  const token = (await loginResp.json()).data as string;

  const boutsResp = await request.get(`/api/${creds.cardId}/bouts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(boutsResp.ok()).toBeTruthy();
  const bouts = (await boutsResp.json()).data as unknown[];
  expect(bouts.length).toBeGreaterThan(0);
});
