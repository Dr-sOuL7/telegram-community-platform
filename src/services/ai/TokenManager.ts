export class TokenManager {
  // Simple heuristic for Vercel edge/serverless to avoid heavy wasm binaries
  // Average English word is ~4-5 characters, 1 token is ~4 chars.
  estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  calculateCostCents(model: string, promptTokens: number, completionTokens: number): number {
    // Current OpenAI pricing (approximate, per 1M tokens) in USD cents
    // gpt-4o-mini: Input $0.150 / 1M, Output $0.600 / 1M => Input 0.000015 cents/token, Output 0.00006 cents/token
    // gpt-4o: Input $5.00 / 1M, Output $15.00 / 1M => Input 0.0005 cents/token, Output 0.0015 cents/token
    
    let inputCostPerTokenCents = 0;
    let outputCostPerTokenCents = 0;

    if (model.includes('gpt-4o-mini')) {
      inputCostPerTokenCents = 0.000015;
      outputCostPerTokenCents = 0.00006;
    } else if (model.includes('gpt-4o')) {
      inputCostPerTokenCents = 0.0005;
      outputCostPerTokenCents = 0.0015;
    } else {
      // Fallback rough estimate
      inputCostPerTokenCents = 0.0001;
      outputCostPerTokenCents = 0.0002;
    }

    const totalCostCents = (promptTokens * inputCostPerTokenCents) + (completionTokens * outputCostPerTokenCents);
    
    // Return at least a tiny fraction or round up if needed, but let's keep precision
    return totalCostCents;
  }
}
