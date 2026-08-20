const { PrismaClient } = require("@prisma/client");
const bcrypt = require("./node_modules/bcrypt");

const prisma = new PrismaClient();

async function main() {
  const newHash = await bcrypt.hash("12345678", 10);
  
  // Verify the hash works
  const ok = await bcrypt.compare("12345678", newHash);
  console.log("Hash gerado e verificado:", ok);

  const result = await prisma.user.updateMany({
    data: {
      passwordHash: newHash,
      mustChangePassword: true,
      isActive: true,
    },
  });

  console.log(`Atualizado ${result.count} usuário(s) com a senha 12345678`);

  // Show users
  const users = await prisma.$queryRaw`SELECT name, email, "mustChangePassword" FROM "User"`;
  console.log("Usuários:", users);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
