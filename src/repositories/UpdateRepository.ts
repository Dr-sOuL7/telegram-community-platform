import { prisma } from '../db/prisma';

export class UpdateRepository {
  /**
   * Read-only check used by the worker BEFORE dispatching, so an already-handled
   * update is skipped without re-running side effects. The durable guarantee
   * still comes from the unique constraint enforced in {@link markProcessed}.
   */
  async isProcessed(updateId: bigint): Promise<boolean> {
    const row = await prisma.processedUpdate.findUnique({
      where: { updateId },
      select: { id: true },
    });
    return row !== null;
  }

  /**
   * Commits the idempotency marker. Called AFTER successful dispatch so that a
   * failed dispatch leaves no marker and QStash can retry. Returns false if the
   * marker already exists (a concurrent/duplicate delivery won the race) — the
   * caller treats that as success since dispatch work is idempotent.
   */
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
