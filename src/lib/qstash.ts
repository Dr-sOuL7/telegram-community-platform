import { Client } from "@upstash/qstash";
import { env } from "../../config/env";

// Ensure env variables QSTASH_TOKEN, QSTASH_CURRENT_SIGNING_KEY, QSTASH_NEXT_SIGNING_KEY are present in the environment for receiver verification.
export const qstashClient = new Client({
  token: env.QSTASH_TOKEN || process.env.QSTASH_TOKEN || "",
});
