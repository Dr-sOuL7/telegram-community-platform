import { prisma } from "../db/prisma";
import { CommunityInsight } from "@prisma/client";

export class CommunityInsightRepository {
  async saveInsight(data: {
    groupId: string;
    category: string;
    insight: string;
    confidence: number;
    severity?: string;
    metadata?: any;
  }): Promise<CommunityInsight> {
    return prisma.communityInsight.create({
      data: {
        ...data,
        metadata: data.metadata ? data.metadata : undefined,
      },
    });
  }

  async saveInsights(insights: Array<{
    groupId: string;
    category: string;
    insight: string;
    confidence: number;
    severity?: string;
    metadata?: any;
  }>): Promise<void> {
    await prisma.communityInsight.createMany({
      data: insights.map(i => ({
        ...i,
        metadata: i.metadata ? i.metadata : undefined,
      })),
    });
  }

  async getInsights(groupId: string, limit: number = 20): Promise<CommunityInsight[]> {
    return prisma.communityInsight.findMany({
      where: { groupId },
      orderBy: { generatedAt: "desc" },
      take: limit,
    });
  }

  async getInsightsByCategory(groupId: string, category: string, limit: number = 10): Promise<CommunityInsight[]> {
    return prisma.communityInsight.findMany({
      where: { groupId, category },
      orderBy: { generatedAt: "desc" },
      take: limit,
    });
  }
}
