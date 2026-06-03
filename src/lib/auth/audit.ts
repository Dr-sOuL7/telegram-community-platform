import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { logger } from "../logger/pino";

/**
 * Writes a DashboardAuditLog entry for a privileged dashboard action.
 * Audit logging must never break the primary action, so failures are
 * swallowed (and reported to the logger/Sentry).
 */
export async function recordDashboardAction(params: {
  dashboardUserId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.dashboardAuditLog.create({
      data: {
        dashboardUserId: params.dashboardUserId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        metadata: (params.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (err) {
    logger.error({ err, action: params.action }, "Failed to write dashboard audit log");
  }
}
