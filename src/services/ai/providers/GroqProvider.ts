import OpenAI from "openai";
import { AICompletionRequest, AICompletionResponse, IAIProvider } from "./AIProvider";
import { env } from "../../../config/env";

export class GroqProvider implements IAIProvider {
  private client: OpenAI;

  constructor() {
    // Groq's API is fully compatible with the OpenAI SDK.
    // We just point the baseURL to Groq and use the Groq API key.
    this.client = new OpenAI({
      apiKey: env.GROQ_API_KEY || "dummy_key_to_prevent_crash",
      baseURL: "https://api.groq.com/openai/v1",
    });
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured.");
    }

    const start = Date.now();
    
    // Default to a fast Groq model if none provided
    const response = await this.client.chat.completions.create({
      model: request.model || "llama-3.1-8b-instant",
      messages: request.messages,
      max_tokens: request.maxTokens || 2048,
      temperature: request.temperature ?? 0.7,
    });

    const latencyMs = Date.now() - start;

    return {
      content: response.choices[0]?.message?.content || "",
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
      model: response.model,
      latencyMs,
    };
  }

  getName(): string {
    return "groq";
  }
}
