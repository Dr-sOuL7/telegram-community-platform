import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

// Shared mock fns (hoisted so the vi.mock factories below can close over them).
const { isProcessed, markProcessed, dispatch, verifyQStashSignature } = vi.hoisted(() => ({
  isProcessed: vi.fn(),
  markProcessed: vi.fn(),
  dispatch: vi.fn(),
  verifyQStashSignature: vi.fn(),
}));

// Avoid the real pino-pretty transport (worker threads) and real deps.
vi.mock('../src/lib/logger/pino', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('../src/lib/qstash', () => ({ verifyQStashSignature }));
vi.mock('../src/repositories/UpdateRepository', () => ({
  UpdateRepository: vi.fn(function () {
    return { isProcessed, markProcessed };
  }),
}));
vi.mock('../src/lib/telegram/UpdateDispatcher', () => ({
  UpdateDispatcher: vi.fn(function () {
    return { dispatch };
  }),
}));

import { POST } from '../src/app/api/v1/worker/process-update/route';

function makeReq(body: unknown): NextRequest {
  return new Request('http://localhost/api/v1/worker/process-update', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe('worker/process-update — reliability invariants', () => {
  beforeEach(() => {
    verifyQStashSignature.mockReset();
    isProcessed.mockReset();
    markProcessed.mockReset();
    dispatch.mockReset();
  });

  it('rejects an invalid QStash signature with 401 and does no work', async () => {
    verifyQStashSignature.mockResolvedValue(false);
    const res = await POST(makeReq({ update_id: 1 }));
    expect(res.status).toBe(401);
    expect(isProcessed).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
    expect(markProcessed).not.toHaveBeenCalled();
  });

  it('drops a malformed update (missing update_id) with 200 and no dispatch — no poison retry', async () => {
    verifyQStashSignature.mockResolvedValue(true);
    const res = await POST(makeReq({ message: { text: 'hi' } }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ dropped: true });
    expect(isProcessed).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
    expect(markProcessed).not.toHaveBeenCalled();
  });

  it('skips an already-processed update without re-dispatching', async () => {
    verifyQStashSignature.mockResolvedValue(true);
    isProcessed.mockResolvedValue(true);
    const res = await POST(makeReq({ update_id: 42 }));
    expect(res.status).toBe(200);
    expect(isProcessed).toHaveBeenCalledWith(BigInt(42));
    expect(dispatch).not.toHaveBeenCalled();
    expect(markProcessed).not.toHaveBeenCalled();
  });

  it('happy path: dispatches THEN marks processed (marker is committed last)', async () => {
    verifyQStashSignature.mockResolvedValue(true);
    isProcessed.mockResolvedValue(false);
    dispatch.mockResolvedValue(undefined);
    markProcessed.mockResolvedValue(true);
    const res = await POST(makeReq({ update_id: 7 }));
    expect(res.status).toBe(200);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(markProcessed).toHaveBeenCalledWith(BigInt(7));
    // Ordering invariant: work happens before the idempotency marker.
    expect(dispatch.mock.invocationCallOrder[0]).toBeLessThan(
      markProcessed.mock.invocationCallOrder[0],
    );
  });

  it('CRITICAL: a dispatch failure returns 500 and does NOT mark processed, so QStash retries (no silent data loss)', async () => {
    verifyQStashSignature.mockResolvedValue(true);
    isProcessed.mockResolvedValue(false);
    dispatch.mockRejectedValue(new Error('transient DB error'));
    const res = await POST(makeReq({ update_id: 9 }));
    expect(res.status).toBe(500);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(markProcessed).not.toHaveBeenCalled();
  });
});
