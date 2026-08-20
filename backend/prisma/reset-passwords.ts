import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const defaultHash = await bcrypt.hash("12345678", 10);

  // Reset all users (Victor, Marcelo, Gustavo, Geraldo) to initial password requiring first access change
  await prisma.user.updateMany({
    data: {
      passwordHash: defaultHash,
      mustChangePassword: true,
      isActive: true,
    },
  });

  console.log("PASSWORDS_RESET_SUCCESS");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
