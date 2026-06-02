import { prisma } from "../db/prisma";
import { Recommendation } from "@prisma/client";

export class RecommendationRepository {
  async saveRecommendation(data: {
    groupId: string;
    category: string;
    recommendation: string;
    confidence: number;
    priority?: string;
    metadata?: any;
  }): Promise<Recommendation> {
    return prisma.recommendation.create({
      data: {
        ...data,
        metadata: data.metadata ? data.metadata : undefined,
      },
    });
  }

  async saveRecommendations(recommendations: Array<{
    groupId: string;
    category: string;
    recommendation: string;
    confidence: number;
    priority?: string;
    metadata?: any;
  }>): Promise<void> {
    await prisma.recommendation.createMany({
      data: recommendations.map(r => ({
        ...r,
        metadata: r.metadata ? r.metadata : undefined,
      })),
    });
  }

  async getRecommendations(groupId: string, status?: string, limit: number = 20): Promise<Recommendation[]> {
    return prisma.recommendation.findMany({
      where: {
        groupId,
        ...(status ? { status } : {}),
      },
      orderBy: { generatedAt: "desc" },
      take: limit,
    });
  }

  async updateStatus(id: string, status: string): Promise<Recommendation> {
    return prisma.recommendation.update({
      where: { id },
      data: { status },
    });
  }
}
