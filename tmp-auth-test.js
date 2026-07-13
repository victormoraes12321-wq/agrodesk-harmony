const fetch = globalThis.fetch || require("undici").fetch;

const users = [
  { email: "victor.ti@agrodesk.com", password: "AgroDesk@123" },
  { email: "marcelo.ti@agrodesk.com", password: "AgroDesk@123" },
  { email: "ana.ribeiro@agrodesk.com", password: "AgroDesk@123" },
  { email: "bruno.araujo@agrodesk.com", password: "AgroDesk@123" },
  { email: "camila.santos@agrodesk.com", password: "AgroDesk@123" },
];

const baseUrl = "http://localhost:3333/api/v1";

async function test() {
  console.log("logging in all users concurrently...");
  const loginResults = await Promise.all(
    users.map(async (user) => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      const text = await res.text();
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
      return { user: user.email, status: res.status, body };
    }),
  );
  console.log(JSON.stringify(loginResults, null, 2));

  console.log("\nverifying /auth/me for each successful login...");
  for (const result of loginResults) {
    if (result.status !== 200) continue;
    const token = result.body.accessToken;
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meText = await meRes.text();
    let meBody;
    try {
      meBody = JSON.parse(meText);
    } catch {
      meBody = meText;
    }
    console.log(result.user, meRes.status, meBody);
  }

  if (loginResults[0].status === 200) {
    console.log("\nrefreshing first user token...");
    const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: loginResults[0].body.refreshToken }),
    });
    const refreshText = await refreshRes.text();
    let refreshBody;
    try {
      refreshBody = JSON.parse(refreshText);
    } catch {
      refreshBody = refreshText;
    }
    console.log("refresh status", refreshRes.status, refreshBody);

    console.log("reusing same refresh token again to confirm rotation invalidation...");
    const refreshRes2 = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: loginResults[0].body.refreshToken }),
    });
    const refreshText2 = await refreshRes2.text();
    let refreshBody2;
    try {
      refreshBody2 = JSON.parse(refreshText2);
    } catch {
      refreshBody2 = refreshText2;
    }
    console.log("second refresh status", refreshRes2.status, refreshBody2);
  }
}

test().catch((error) => {
  console.error(error);
  process.exit(1);
});
