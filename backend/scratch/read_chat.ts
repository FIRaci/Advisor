import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const chats = await prisma.chat.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  chats.forEach(chat => {
    console.log(`[${chat.role}] ${chat.content.substring(0, 100)}...`);
  });
}
main().finally(() => prisma.$disconnect());
