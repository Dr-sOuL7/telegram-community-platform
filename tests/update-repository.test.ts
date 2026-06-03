import { describe, it, expect, vi, beforeEach } from 'vitest';

const { create, findUnique } = vi.hoisted(() => ({
  create: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock('../src/db/prisma', () => ({
  prisma: { processedUpdate: { create, findUnique } },
}));

import { UpdateRepository } from '../src/repositories/UpdateRepository';

describe('UpdateRepository — idempotency marker semantics', () => {
  const repo = new UpdateRepository();

  beforeEach(() => {
    create.mockReset();
    findUnique.mockReset();
  });

  it('markProcessed returns true on a fresh insert', async () => {
    create.mockResolvedValue({ id: 'u1' });
    await expect(repo.markProcessed(BigInt(1))).resolves.toBe(true);
    expect(create).toHaveBeenCalledWith({ data: { updateId: BigInt(1) } });
  });

  it('markProcessed returns false on a P2002 unique violation (duplicate delivery won the race)', async () => {
    create.mockRejectedValue(Object.assign(new Error('unique'), { code: 'P2002' }));
    await expect(repo.markProcessed(BigInt(1))).resolves.toBe(false);
  });

  it('markProcessed rethrows non-P2002 errors so the worker fails and QStash retries', async () => {
    create.mockRejectedValue(Object.assign(new Error('db down'), { code: 'P1001' }));
    await expect(repo.markProcessed(BigInt(1))).rejects.toMatchObject({ code: 'P1001' });
  });

  it('isProcessed returns true when a marker row exists', async () => {
    findUnique.mockResolvedValue({ id: 'u1' });
    await expect(repo.isProcessed(BigInt(1))).resolves.toBe(true);
    expect(findUnique).toHaveBeenCalledWith({ where: { updateId: BigInt(1) }, select: { id: true } });
  });

  it('isProcessed returns false when no marker row exists', async () => {
    findUnique.mockResolvedValue(null);
    await expect(repo.isProcessed(BigInt(1))).resolves.toBe(false);
  });
});
