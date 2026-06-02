export interface AICompletionRequest {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AICompletionResponse {
  content: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  latencyMs: number;
}

export interface IAIProvider {
  complete(request: AICompletionRequest): Promise<AICompletionResponse>;
  getName(): string;
}
