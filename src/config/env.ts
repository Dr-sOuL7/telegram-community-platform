import { z } from "zod";

/**
 * Strict boolean parser for environment variables.
 *
 * IMPORTANT: We must NOT use `z.coerce.boolean()`. It applies JS `Boolean()`,
 * for which `Boolean("false") === true` — so `FEATURE_AI=false` would ENABLE
 * the feature (and the associated AI spend). This parser treats the var as a
 * proper flag: only explicit truthy strings enable it; explicit falsy strings
 * and unset both resolve to the provided default.
 */
const TRUTHY = new Set(["true", "1", "yes", "on"]);
const FALSY = new Set(["false", "0", "no", "off", ""]);
const boolEnv = (defaultValue: boolean) =>
  z.preprocess((raw) => {
    if (typeof raw !== "string") return defaultValue; // unset → default
    const v = raw.trim().toLowerCase();
    if (TRUTHY.has(v)) return true;
    if (FALSY.has(v)) return false;
    return defaultValue; // unrecognised → default rather than silently truthy
  }, z.boolean());

export const envSchema = z.object({
  // Telegram Configuration
  BOT_TOKEN: z.string().min(1, "BOT_TOKEN is required"),
  WEBHOOK_SECRET: z.string().min(1, "WEBHOOK_SECRET is required"),
  
  // Database Configuration
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  
  // Supabase Configuration
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL").optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  
  // Application URL (for webhook setup and QStash callbacks)
  APP_URL: z.string().url("APP_URL must be a valid URL — required for QStash callbacks"),

  // Auth Configuration
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  INITIAL_ADMIN_EMAIL: z.string().email().optional(),
  INITIAL_ADMIN_PASSWORD: z.string().min(1).optional(),

  // Feature Flags
  FEATURE_ANALYTICS: boolEnv(false),
  FEATURE_REPORTS: boolEnv(false),
  FEATURE_HEALTH_SCORE: boolEnv(false),
  FEATURE_REPUTATION: boolEnv(true),

  // AI Configuration
  GROQ_API_KEY: z.string().min(1).optional(),

  // AI Feature Flags
  FEATURE_AI: boolEnv(false),
  FEATURE_SUMMARIZATION: boolEnv(false),
  FEATURE_AI_INSIGHTS: boolEnv(false),
  FEATURE_AI_REPORTS: boolEnv(false),
  FEATURE_AI_RECOMMENDATIONS: boolEnv(false),
  FEATURE_AI_ASSISTANT: boolEnv(false),

  // Cron Security
  CRON_SECRET: z.string().min(1, "CRON_SECRET is required to secure cron endpoints"),

  // Upstash QStash — REQUIRED for the event queue pipeline
  QSTASH_TOKEN: z.string().min(1, "QSTASH_TOKEN is required — configure Upstash QStash"),
  QSTASH_CURRENT_SIGNING_KEY: z.string().min(1, "QSTASH_CURRENT_SIGNING_KEY is required — configure Upstash QStash"),
  QSTASH_NEXT_SIGNING_KEY: z.string().min(1, "QSTASH_NEXT_SIGNING_KEY is required — configure Upstash QStash"),
});

// We parse process.env when this module is imported to fail fast if env vars are missing
export const env = envSchema.parse(process.env);
