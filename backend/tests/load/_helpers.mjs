import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";

export const API_BASE_URL = (
  process.env.LOAD_API_BASE_URL ?? "http://127.0.0.1:3333/api/v1"
).replace(/\/+$/, "");
export const DEFAULT_PASSWORD = process.env.LOAD_TEST_PASSWORD ?? "AgroDeskCarga@2026";
export const INITIAL_PASSWORD = process.env.LOAD_TEST_INITIAL_PASSWORD ?? "AgroDesk@2026";
export const RESULTS_DIR = path.join(process.cwd(), "tests", "load", "results");

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function assertCondition(condition, message) {
  if (!condition) throw new Error(message);
}

export function ensureResultsDir() {
  if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

export function writeJsonResult(filename, payload) {
  ensureResultsDir();
  const fullPath = path.join(RESULTS_DIR, filename);
  fs.writeFileSync(fullPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return fullPath;
}

function parseBodyByContentType(text, contentType) {
  if (!text) return null;
  if (contentType?.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }
  return { raw: text };
}

export async function requestApi(endpoint, options = {}) {
  const { method = "GET", token, body, formData, headers = {} } = options;
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const requestHeaders = { ...headers };

  let requestBody;
  if (formData) {
    requestBody = formData;
  } else if (body !== undefined) {
    requestBody = JSON.stringify(body);
    requestHeaders["Content-Type"] = "application/json";
  }

  if (token) requestHeaders.Authorization = `Bearer ${token}`;

  const start = performance.now();
  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: requestBody,
  });
  const durationMs = performance.now() - start;
  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  const data = parseBodyByContentType(text, contentType);

  return {
    ok: response.ok,
    status: response.status,
    durationMs,
    data,
    text,
    headers: response.headers,
    url,
    method,
  };
}

export async function login(email, password = DEFAULT_PASSWORD) {
  const response = await requestApi("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  return response;
}

export function createMetrics(name) {
  return {
    name,
    total: 0,
    ok: 0,
    failed: 0,
    durationsMs: [],
    byStatus: {},
    failures: [],
  };
}

export function addMetricResult(metrics, result, context = {}) {
  metrics.total += 1;
  metrics.byStatus[result.status] = (metrics.byStatus[result.status] ?? 0) + 1;
  metrics.durationsMs.push(result.durationMs);
  if (result.ok) {
    metrics.ok += 1;
    return;
  }
  metrics.failed += 1;
  metrics.failures.push({
    status: result.status,
    body: result.data ?? result.text,
    ...context,
  });
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

export function summarizeMetrics(metrics) {
  const sum = metrics.durationsMs.reduce((acc, cur) => acc + cur, 0);
  const avg = metrics.durationsMs.length === 0 ? 0 : sum / metrics.durationsMs.length;
  return {
    name: metrics.name,
    total: metrics.total,
    ok: metrics.ok,
    failed: metrics.failed,
    byStatus: metrics.byStatus,
    avgMs: Number(avg.toFixed(2)),
    minMs: Number((metrics.durationsMs.length ? Math.min(...metrics.durationsMs) : 0).toFixed(2)),
    p50Ms: Number(percentile(metrics.durationsMs, 50).toFixed(2)),
    p90Ms: Number(percentile(metrics.durationsMs, 90).toFixed(2)),
    p95Ms: Number(percentile(metrics.durationsMs, 95).toFixed(2)),
    p99Ms: Number(percentile(metrics.durationsMs, 99).toFixed(2)),
    maxMs: Number((metrics.durationsMs.length ? Math.max(...metrics.durationsMs) : 0).toFixed(2)),
    failures: metrics.failures,
  };
}

async function ensureUserPasswordReady(user) {
  let currentPassword = DEFAULT_PASSWORD;
  let loginResult = await login(user.email, currentPassword);

  if (!loginResult.ok) {
    currentPassword = INITIAL_PASSWORD;
    loginResult = await login(user.email, currentPassword);
  }

  assertCondition(
    loginResult.ok,
    `Falha ao preparar senha de ${user.email}: ${loginResult.status}`,
  );
  if (!loginResult.data.user.mustChangePassword) return;

  const passwordChange = await requestApi("/users/me/password", {
    method: "PATCH",
    token: loginResult.data.accessToken,
    body: {
      currentPassword,
      newPassword: DEFAULT_PASSWORD,
    },
  });
  assertCondition(
    passwordChange.ok,
    `Falha ao concluir primeiro acesso de ${user.email}: ${passwordChange.status}`,
  );
}

export async function getAdminToken(
  email = process.env.LOAD_TEST_ADMIN_EMAIL ?? "marcelo.ti@agrodesk.com",
  password = DEFAULT_PASSWORD,
) {
  let loginResult = await login(email, password);
  if (!loginResult.ok) loginResult = await login(email, INITIAL_PASSWORD);
  if (loginResult.ok && loginResult.data.user.mustChangePassword) {
    await ensureUserPasswordReady(loginResult.data.user);
    loginResult = await login(email, password);
  }
  if (!loginResult.ok) {
    throw new Error(
      `Falha ao autenticar admin (${email}): ${loginResult.status} ${JSON.stringify(loginResult.data)}`,
    );
  }
  return loginResult.data.accessToken;
}

export async function fetchAllBaseData(adminToken) {
  const [usersRes, departmentsRes, branchesRes, categoriesRes] = await Promise.all([
    requestApi("/users", { token: adminToken }),
    requestApi("/departments", { token: adminToken }),
    requestApi("/branches", { token: adminToken }),
    requestApi("/categories", { token: adminToken }),
  ]);
  assertCondition(usersRes.ok, `Falha ao listar usuarios: ${usersRes.status}`);
  assertCondition(departmentsRes.ok, `Falha ao listar setores: ${departmentsRes.status}`);
  assertCondition(branchesRes.ok, `Falha ao listar filiais: ${branchesRes.status}`);
  assertCondition(categoriesRes.ok, `Falha ao listar categorias: ${categoriesRes.status}`);

  return {
    users: usersRes.data,
    departments: departmentsRes.data,
    branches: branchesRes.data,
    categories: categoriesRes.data,
  };
}

export async function ensureUsersForLoad(adminToken, options = {}) {
  const requiredSolicitantes = options.solicitantes ?? 36;
  const requiredAdmins = options.admins ?? 4;
  const { users, departments, branches } = await fetchAllBaseData(adminToken);

  const activeAdmins = users.filter((user) => user.role === "TI_ADMIN" && user.isActive);
  assertCondition(
    activeAdmins.length >= requiredAdmins,
    `Precisa de ao menos ${requiredAdmins} TI_ADMIN ativos.`,
  );

  let solicitantes = users.filter((user) => user.role === "SOLICITANTE" && user.isActive);
  const missing = Math.max(0, requiredSolicitantes - solicitantes.length);

  for (let i = 0; i < missing; i += 1) {
    const sequence = String(i + 1).padStart(2, "0");
    const department = departments[i % departments.length];
    const branch = branches[i % branches.length];
    const payload = {
      name: `Carga Solicitante ${sequence}`,
      email: `carga.solicitante.${sequence}@agrodesk.com`,
      password: INITIAL_PASSWORD,
      role: "SOLICITANTE",
      phone: `(44) 9${String(80000000 + i).slice(-8)}`,
      departmentId: department.id,
      branchId: branch.id,
      jobTitle: "Operador de Carga",
      notes: "Usuario de teste de carga",
      active: true,
    };

    const created = await requestApi("/users", {
      method: "POST",
      token: adminToken,
      body: payload,
    });

    if (!created.ok && created.status !== 400) {
      throw new Error(
        `Falha ao criar usuario de carga (${payload.email}): ${created.status} ${JSON.stringify(created.data)}`,
      );
    }
  }

  const usersAfter = await requestApi("/users", { token: adminToken });
  assertCondition(usersAfter.ok, `Falha ao reler usuarios: ${usersAfter.status}`);
  const allUsers = usersAfter.data;

  await Promise.all(allUsers.map((user) => ensureUserPasswordReady(user)));

  solicitantes = allUsers
    .filter((user) => user.role === "SOLICITANTE" && user.isActive)
    .slice(0, requiredSolicitantes);
  const admins = allUsers
    .filter((user) => user.role === "TI_ADMIN" && user.isActive)
    .slice(0, requiredAdmins);

  assertCondition(
    solicitantes.length >= requiredSolicitantes,
    `Nao foi possivel obter ${requiredSolicitantes} solicitantes ativos.`,
  );
  assertCondition(
    admins.length >= requiredAdmins,
    `Nao foi possivel obter ${requiredAdmins} admins ativos.`,
  );

  return { solicitantes, admins, allUsers, departments, branches };
}

export function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export async function runConcurrently(taskCount, taskFactory) {
  return Promise.all(Array.from({ length: taskCount }).map((_, index) => taskFactory(index)));
}
