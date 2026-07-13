import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { name: "Victor" }
  });
  if (!user) {
    console.log("Victor not found");
    return;
  }
  const password = "victor123";
  const match = await bcrypt.compare(password, user.passwordHash);
  console.log("Victor hash in DB:", user.passwordHash);
  console.log("Comparing with 'victor123':", match);
}

main().catch(console.error).finally(() => prisma.$disconnect());
