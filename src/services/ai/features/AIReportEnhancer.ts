import { AIOrchestrator } from "../AIOrchestrator";

export class AIReportEnhancer {
  constructor(private orchestrator: AIOrchestrator) {}

  async enhanceReport(groupId: string, rawPayload: any): Promise<string> {
    const request = {
      messages: [
        { role: "system" as const, content: `You are an executive community analyst. Write a concise executive summary and trend analysis for this report.` },
        { role: "user" as const, content: `Report Data:\n${JSON.stringify(rawPayload, null, 2)}` }
      ],
      temperature: 0.5,
    };

    const response = await this.orchestrator.execute("report_enhancement", "FEATURE_AI_REPORTS", groupId, request);
    
    return response.content;
  }
}
