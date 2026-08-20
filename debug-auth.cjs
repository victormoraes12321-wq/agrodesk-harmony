const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const bcrypt = require('./backend/node_modules/bcrypt');
const prisma = new PrismaClient();

async function main() {
  // Checar Victor
  const user = await prisma.user.findFirst({ where: { username: 'Victor' } });
  if (!user) { console.log('USUARIO Victor NAO ENCONTRADO'); return; }
  
  console.log('=== USUARIO VICTOR ===');
  console.log('ID:', user.id);
  console.log('Username:', user.username);
  console.log('Name:', user.name);
  console.log('Role:', user.role);
  console.log('isActive:', user.isActive);
  console.log('mustChangePassword:', user.mustChangePassword);
  console.log('passwordHash:', user.passwordHash ? user.passwordHash.substring(0, 20) + '...' : 'NULL/VAZIO');

  if (!user.passwordHash) {
    console.log('\n!!! HASH VAZIO - ESSE E O PROBLEMA !!!');
  } else {
    const tests = ['H0llyw00d26', 'Agrodesk@2026', '12345678', 'victor', 'Victor', 'casadocampo'];
    for (const pw of tests) {
      const ok = await bcrypt.compare(pw, user.passwordHash);
      if (ok) console.log(`\n>>> Senha correta: "${pw}"`);
      else console.log(`    Senha incorreta: "${pw}"`);
    }
  }

  // Checar todos os usuarios
  console.log('\n=== TODOS OS USUARIOS ===');
  const all = await prisma.user.findMany({ select: { username: true, role: true, isActive: true, mustChangePassword: true, passwordHash: true } });
  for (const u of all) {
    const hasHash = !!(u.passwordHash && u.passwordHash.length > 10);
    console.log(`${u.username} | ${u.role} | active:${u.isActive} | mustChange:${u.mustChangePassword} | hasHash:${hasHash}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
