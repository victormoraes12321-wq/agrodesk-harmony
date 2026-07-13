import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { RESULTS_DIR, writeJsonResult } from "./_helpers.mjs";

const TEST_COMMANDS = [
  { script: "load-test-login", result: "load-test-login.result.json" },
  { script: "load-test-create-tickets", result: "load-test-create-tickets.result.json" },
  { script: "load-test-admin-actions", result: "load-test-admin-actions.result.json" },
  { script: "e2e-critical-flows", result: "e2e-critical-flows.result.json" },
];

function runNpmScript(script) {
  return new Promise((resolve) => {
    const child = spawn("npm", ["run", script], {
      shell: true,
      cwd: process.cwd(),
      stdio: "inherit",
      env: process.env,
    });
    child.on("close", (code) => {
      resolve(code ?? 1);
    });
  });
}

function loadResultFile(filename) {
  const fullPath = path.join(RESULTS_DIR, filename);
  if (!fs.existsSync(fullPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch {
    return null;
  }
}

async function main() {
  const startedAt = new Date().toISOString();
  const execution = [];
  let failed = false;

  for (const item of TEST_COMMANDS) {
    const started = Date.now();
    const code = await runNpmScript(item.script);
    const durationMs = Date.now() - started;
    const result = loadResultFile(item.result);
    const checks = result?.checks ?? null;
    const failedChecks = checks
      ? Object.entries(checks)
          .filter(([, value]) => !value)
          .map(([key]) => key)
      : ["no-result-file"];

    execution.push({
      script: item.script,
      exitCode: code,
      durationMs,
      resultFile: item.result,
      failedChecks,
    });

    if (code !== 0 || failedChecks.length > 0) failed = true;
  }

  const suiteSummary = {
    startedAt,
    finishedAt: new Date().toISOString(),
    execution,
    success: !failed,
  };

  const output = writeJsonResult("heavy-suite-summary.result.json", suiteSummary);
  console.log(`Suite pesada finalizada. Resultado consolidado: ${output}`);

  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Falha ao executar suite pesada:", error);
  process.exitCode = 1;
});
