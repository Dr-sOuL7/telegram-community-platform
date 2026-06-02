import { prisma } from "../db/prisma";
import { AIUsageLog } from "@prisma/client";

export class AIUsageRepository {
  async logUsage(data: {
    groupId?: string;
    feature: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number;
    latencyMs: number;
    success: boolean;
    errorMessage?: string;
  }): Promise<AIUsageLog> {
    return prisma.aIUsageLog.create({
      data,
    });
  }

  async getDailyCostCents(date: Date, groupId?: string): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const result = await prisma.aIUsageLog.aggregate({
      _sum: {
        estimatedCost: true,
      },
      where: {
        ...(groupId ? { groupId } : {}),
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return result._sum.estimatedCost || 0;
  }

  async getTotalCost(startDate: Date, endDate: Date, groupId?: string): Promise<number> {
    const result = await prisma.aIUsageLog.aggregate({
      _sum: {
        estimatedCost: true,
      },
      where: {
        ...(groupId ? { groupId } : {}),
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return result._sum.estimatedCost || 0;
  }

  async getUsageByFeature(startDate: Date, endDate: Date, groupId?: string) {
    return prisma.aIUsageLog.groupBy({
      by: ['feature'],
      _sum: {
        totalTokens: true,
        estimatedCost: true,
      },
      _count: {
        _all: true,
      },
      where: {
        ...(groupId ? { groupId } : {}),
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }
}
