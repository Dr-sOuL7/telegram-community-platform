import { AIOrchestrator } from "../AIOrchestrator";
import { ConversationSummaryRepository } from "../../../repositories/ConversationSummaryRepository";
import { PromptManager } from "../PromptManager";

export class SummarizationService {
  constructor(
    private orchestrator: AIOrchestrator,
    private summaryRepo: ConversationSummaryRepository
  ) {}

  async summarize(groupId: string, timeRangeStart: Date, timeRangeEnd: Date): Promise<string> {
    const context = await this.orchestrator.contextBuilder.buildMessageContext(groupId, timeRangeStart, timeRangeEnd, 200);

    const request = {
      messages: [
        { role: "system" as const, content: PromptManager.getSummarizationSystemPrompt() },
        { role: "user" as const, content: `Please summarize the following conversation:\n\n${context}` }
      ],
      temperature: 0.3, // Lower temperature for more factual summaries
    };

    const response = await this.orchestrator.execute("summarization", "FEATURE_SUMMARIZATION", groupId, request);

    try {
      // Clean up markdown block if present
      const cleanJson = response.content.replace(/```json\n?|\n?```/gi, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      await this.summaryRepo.saveSummary({
        groupId,
        title: `Summary: ${timeRangeStart.toLocaleDateString()}`,
        summary: parsed.summary || "No summary available.",
        topics: parsed.topics || [],
        decisions: parsed.decisions || [],
        actionItems: parsed.actionItems || [],
        timeRangeStart,
        timeRangeEnd,
        messageCount: context.split("\n").length, // rough estimate
        tokensUsed: response.totalTokens,
      });

      const finalSummary = parsed.summary || "No messages to summarize in this time range.";
      const finalTopics = (parsed.topics && parsed.topics.length > 0) ? parsed.topics.join(", ") : "None";

      return `Summary: ${finalSummary}\n\nTopics: ${finalTopics}`;
    } catch (error) {
      // Fallback if AI didn't output valid JSON
      return `Failed to parse AI summary. Raw output:\n${response.content}`;
    }
  }
}
