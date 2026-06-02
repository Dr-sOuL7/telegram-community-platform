import { Client, Receiver } from "@upstash/qstash";

// Lazy-initialized QStash client.
// We must NOT create the client at module-level because Vercel evaluates
// all modules during the build phase when env vars are not yet available.
let _client: Client | null = null;

export function getQStashClient(): Client {
  if (!_client) {
    const token = process.env.QSTASH_TOKEN;
    if (!token) {
      throw new Error("QSTASH_TOKEN environment variable is not set");
    }
    _client = new Client({ token });
  }
  return _client;
}

// Lazy-initialized QStash signature receiver for worker routes.
let _receiver: Receiver | null = null;

export function getQStashReceiver(): Receiver {
  if (!_receiver) {
    const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
    const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
    if (!currentSigningKey || !nextSigningKey) {
      throw new Error("QSTASH_CURRENT_SIGNING_KEY and QSTASH_NEXT_SIGNING_KEY environment variables are required");
    }
    _receiver = new Receiver({ currentSigningKey, nextSigningKey });
  }
  return _receiver;
}

// Helper to verify QStash signatures inside worker route handlers.
// Use this INSTEAD of verifySignatureAppRouter() which fails at build time.
export async function verifyQStashSignature(req: Request): Promise<boolean> {
  const receiver = getQStashReceiver();
  const signature = req.headers.get("upstash-signature");
  if (!signature) return false;

  const body = await req.clone().text();
  try {
    await receiver.verify({ body, signature });
    return true;
  } catch {
    return false;
  }
}
