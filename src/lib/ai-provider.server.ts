/**
 * AI Provider Interface
 * Purpose: Provider-agnostic interface for future AI integrations (Gemini, OpenAI, etc.).
 * Status: ARCHITECTURAL PREP
 */
import { type ExtractedOrderData } from "./ai.shared";

export interface AIProvider {
  extractOrderData(text: string): Promise<ExtractedOrderData>;
}

/**
 * MOCK Provider for architectural demonstration.
 * In the future, real providers like GeminiProvider or OpenAIProvider will be added here.
 */
export class MockAIProvider implements AIProvider {
  async extractOrderData(text: string): Promise<ExtractedOrderData> {
    console.log("[AI Prep] Mock extraction triggered for text:", text);
    // This will eventually perform a real API call based on settings.
    return {}; 
  }
}

export class AIProviderFactory {
  static getProvider(providerType: string): AIProvider {
    // In the future, this switch will return the actual implementation.
    return new MockAIProvider();
  }
}
