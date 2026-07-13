import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const baseUrl = 'http://localhost:3333/api/v1';

async function main() {
  const loginResponse = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'victor.ti@agrodesk.com', password: 'AgroDesk@123' }),
  });
  const loginData = await loginResponse.json();
  console.log('login status', loginResponse.status);
  console.log('refresh-token original prefix', loginData.refreshToken.slice(0, 50));

  const tokensAfterLogin = await prisma.refreshToken.findMany({
    where: {
      user: { email: 'victor.ti@agrodesk.com' },
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
  console.log('tokens after login', tokensAfterLogin.map((token) => ({ id: token.id, revokedAt: token.revokedAt, createdAt: token.createdAt.toISOString() })));

  const refreshResponse1 = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: loginData.refreshToken }),
  });
  const refreshData1 = await refreshResponse1.text();
  console.log('refresh1 status', refreshResponse1.status, refreshData1);

  const tokensAfterRefresh1 = await prisma.refreshToken.findMany({
    where: {
      user: { email: 'victor.ti@agrodesk.com' },
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
  console.log('tokens after refresh1', tokensAfterRefresh1.map((token) => ({ id: token.id, revokedAt: token.revokedAt, createdAt: token.createdAt.toISOString() })));

  const refreshResponse2 = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: loginData.refreshToken }),
  });
  const refreshData2 = await refreshResponse2.text();
  console.log('refresh2 status', refreshResponse2.status, refreshData2);

  const tokensAfterRefresh2 = await prisma.refreshToken.findMany({
    where: {
      user: { email: 'victor.ti@agrodesk.com' },
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
  console.log('tokens after refresh2', tokensAfterRefresh2.map((token) => ({ id: token.id, revokedAt: token.revokedAt, createdAt: token.createdAt.toISOString() })));

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
