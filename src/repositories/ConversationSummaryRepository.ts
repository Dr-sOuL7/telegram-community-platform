import { prisma } from "../db/prisma";
import { ConversationSummary } from "@prisma/client";

export class ConversationSummaryRepository {
  async saveSummary(data: {
    groupId: string;
    title: string;
    summary: string;
    topics?: string[];
    decisions?: string[];
    actionItems?: string[];
    timeRangeStart: Date;
    timeRangeEnd: Date;
    messageCount: number;
    tokensUsed: number;
  }): Promise<ConversationSummary> {
    return prisma.conversationSummary.create({
      data: {
        ...data,
        topics: data.topics ? data.topics : undefined,
        decisions: data.decisions ? data.decisions : undefined,
        actionItems: data.actionItems ? data.actionItems : undefined,
      },
    });
  }

  async getSummaries(groupId: string, limit: number = 10): Promise<ConversationSummary[]> {
    return prisma.conversationSummary.findMany({
      where: { groupId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async getLatestSummary(groupId: string): Promise<ConversationSummary | null> {
    return prisma.conversationSummary.findFirst({
      where: { groupId },
      orderBy: { createdAt: "desc" },
    });
  }
}
