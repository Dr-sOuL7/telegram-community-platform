import { z } from "zod";

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
  
  // Application URL (for webhook setup)
  APP_URL: z.string().url("APP_URL must be a valid URL").optional(),

  // Feature Flags
  FEATURE_ANALYTICS: z.coerce.boolean().default(false),
  FEATURE_REPORTS: z.coerce.boolean().default(false),
  FEATURE_HEALTH_SCORE: z.coerce.boolean().default(false),
  FEATURE_AI: z.coerce.boolean().default(false),
  FEATURE_REPUTATION: z.coerce.boolean().default(true),

  // Cron Security
  CRON_SECRET: z.string().min(1, "CRON_SECRET is required to secure cron endpoints"),
});

// We parse process.env when this module is imported to fail fast if env vars are missing
export const env = envSchema.parse(process.env);
