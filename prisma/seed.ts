import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * SYSTEM user — used as the `moderatorId` for all automated moderation actions
 * (spam detection, auto-mute, auto-ban). This ensures audit trails never
 * attribute bot actions to a real user.
 */
export const SYSTEM_USER_TELEGRAM_ID = BigInt(0);
export const SYSTEM_USER_ID_SENTINEL = 'SYSTEM'; // We'll use the actual UUID after upsert

async function main() {
  console.log('🌱 Seeding database...');

  // Upsert the SYSTEM user
  const systemUser = await prisma.user.upsert({
    where: { telegramId: SYSTEM_USER_TELEGRAM_ID },
    update: {},
    create: {
      telegramId: SYSTEM_USER_TELEGRAM_ID,
      firstName: 'SYSTEM',
      username: 'sentinel_system',
      reputation: 0,
      isActive: true,
    },
  });

  console.log(`✅ SYSTEM user ready: ${systemUser.id}`);
  console.log('🌱 Seed complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
