import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prisma: PrismaClient;

if (globalForPrisma.prisma) {
  prisma = globalForPrisma.prisma;
} else {
  // Serverless connection management.
  // Each warm lambda instance keeps its own pool; Vercel fans out to many
  // concurrent instances, so an unbounded pool (pg default max=10/instance)
  // can exhaust Supabase's connection limit under webhook bursts.
  //
  // REQUIREMENT: DATABASE_URL must target the Supabase *pooler* (port 6543,
  // transaction mode), NOT the direct connection (5432). With the pooler we
  // keep `max` small per instance.
  const pool = new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
  });
  const adapter = new PrismaPg(pool);
  
  prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export { prisma };
