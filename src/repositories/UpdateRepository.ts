import { prisma } from '../db/prisma';

export class UpdateRepository {
  async markProcessed(updateId: bigint): Promise<boolean> {
    try {
      await prisma.processedUpdate.create({
        data: { updateId },
      });
      return true; // Successfully marked
    } catch (error: any) {
      // Prisma error code for unique constraint violation
      if (error.code === 'P2002') {
        return false; // Already processed
      }
      throw error;
    }
  }
}
