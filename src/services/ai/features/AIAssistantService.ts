import { AIOrchestrator } from "../AIOrchestrator";
import { ContextBuilder } from "../ContextBuilder";
import { PromptManager } from "../PromptManager";

export class AIAssistantService {
  constructor(
    private orchestrator: AIOrchestrator,
    private contextBuilder: ContextBuilder
  ) {}

  async answerQuestion(groupId: string, question: string): Promise<string> {
    const groupContext = await this.contextBuilder.buildGroupContext(groupId);
    const analyticsContext = await this.contextBuilder.buildAnalyticsContext(groupId, 3); // last 3 days

    const request = {
      messages: [
        { role: "system" as const, content: PromptManager.getAssistantSystemPrompt() },
        { role: "user" as const, content: `Context:\n${groupContext}\n\nRecent Trends:\n${analyticsContext}\n\nQuestion: ${question}` }
      ],
      temperature: 0.5,
    };

    const response = await this.orchestrator.execute("assistant", "FEATURE_AI_ASSISTANT", groupId, request);
    
    return response.content;
  }
  
  async analyzeUser(groupId: string, userId: string): Promise<string> {
    const userContext = await this.contextBuilder.buildUserContext(groupId, userId);
    
    const request = {
      messages: [
        { role: "system" as const, content: PromptManager.getUserAnalysisSystemPrompt() },
        { role: "user" as const, content: `Analyze this user profile:\n\n${userContext}` }
      ],
      temperature: 0.4,
    };

    const response = await this.orchestrator.execute("assistant", "FEATURE_AI_ASSISTANT", groupId, request);
    
    return response.content;
  }
  
  async analyzeGroup(groupId: string): Promise<string> {
    const groupContext = await this.contextBuilder.buildGroupContext(groupId);
    const analyticsContext = await this.contextBuilder.buildAnalyticsContext(groupId, 7);

    const request = {
      messages: [
        { role: "system" as const, content: `You are an expert community manager AI. Provide a comprehensive plain text analysis of the group's health and activity.` },
        { role: "user" as const, content: `Group Status:\n${groupContext}\n\n7-Day Trends:\n${analyticsContext}` }
      ],
      temperature: 0.5,
    };

    const response = await this.orchestrator.execute("assistant", "FEATURE_AI_ASSISTANT", groupId, request);
    
    return response.content;
  }
}
