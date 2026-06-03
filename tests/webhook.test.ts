import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

const { publishJSON } = vi.hoisted(() => ({ publishJSON: vi.fn() }));

vi.mock('../src/lib/logger/pino', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('../src/config/env', () => ({
  env: { WEBHOOK_SECRET: 'top-secret', APP_URL: 'http://localhost:3000' },
}));
vi.mock('../src/lib/qstash', () => ({
  getQStashClient: vi.fn(() => ({ publishJSON })),
}));

import { POST } from '../src/app/api/v1/webhook/route';

function makeReq(body: unknown, secret?: string): NextRequest {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (secret !== undefined) headers['x-telegram-bot-api-secret-token'] = secret;
  return new Request('http://localhost/api/v1/webhook', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe('webhook — ingress auth & enqueue', () => {
  beforeEach(() => {
    publishJSON.mockReset();
  });

  it('rejects a request with no Telegram secret token (401) and does not enqueue', async () => {
    const res = await POST(makeReq({ update_id: 1 }));
    expect(res.status).toBe(401);
    expect(publishJSON).not.toHaveBeenCalled();
  });

  it('rejects a wrong secret token (401)', async () => {
    const res = await POST(makeReq({ update_id: 1 }, 'wrong'));
    expect(res.status).toBe(401);
    expect(publishJSON).not.toHaveBeenCalled();
  });

  it('enqueues a valid update with a per-update deduplication id pointed at the worker', async () => {
    publishJSON.mockResolvedValue({ messageId: 'q1' });
    const res = await POST(makeReq({ update_id: 123 }, 'top-secret'));
    expect(res.status).toBe(200);
    expect(publishJSON).toHaveBeenCalledTimes(1);
    const arg = publishJSON.mock.calls[0][0] as { deduplicationId: string; url: string };
    expect(arg.deduplicationId).toBe('tg-update-123');
    expect(arg.url).toContain('/api/v1/worker/process-update');
  });

  it('returns 500 when the enqueue fails, so Telegram backs off and retries (no silent loss)', async () => {
    publishJSON.mockRejectedValue(new Error('QStash down'));
    const res = await POST(makeReq({ update_id: 5 }, 'top-secret'));
    expect(res.status).toBe(500);
  });
});
