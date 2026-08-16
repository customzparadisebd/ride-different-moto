# AI-Powered Order Extraction Architecture Plan

Prepare the existing Order Management system for future AI-powered order data extraction. This plan implements a provider-agnostic architecture, an Admin settings panel, and a UI skeleton for the "Organize with AI" feature.

## User Review Required

> [!IMPORTANT]
> The AI feature will be **OFF** by default. No AI requests will be made, and no API keys are required during this implementation.

- The feature will be accessible via an "AI Settings" tab in the Admin Panel.
- A new "Organize with AI" section will appear in the Manual Order Form only when the feature is enabled.

## Proposed Changes

### Database & Backend
- Create `public.ai_settings` table to store provider-agnostic configuration:
  - `feature_enabled` (boolean, default false)
  - `provider` (enum: 'gemini', 'openai', 'custom')
  - `model_name` (text)
  - `api_key` (text, encrypted at rest if possible, or managed via secrets)
  - `credentials` (jsonb)
- Implement `ai.shared.ts` for Zod schemas and types.
- Implement `ai.functions.ts` for server-side settings management.
- Implement `ai-provider.server.ts` as a provider-agnostic interface/factory for future integrations.

### Admin Panel
- Add `AISettingsPanel.tsx` to the Settings route.
- Include controls for:
  - Feature Toggle (ON/OFF)
  - Provider selection
  - Model name input
  - API Key field (password type for security)
  - "Test Connection" button (skeleton/mocked for now)

### Order Management UI
- Modify `ManualOrderForm.tsx`:
  - Add an "Organize with AI" text area (visible only when enabled).
  - Add a button to trigger extraction.
  - Implement a mapping layer to populate form fields from AI-returned structured data.

## Technical Details

### Provider Agnostic Architecture
```typescript
interface AIProvider {
  extractOrderData(text: string): Promise<ExtractedOrderData>;
}

class AIProviderFactory {
  static getProvider(config: AISettings): AIProvider {
    // Returns GeminiProvider, OpenAIProvider, etc.
  }
}
```

### Security
- API keys will be handled as sensitive data.
- RBAC: Only `super_admin` or `admin` with `api.manage` permission can configure AI settings.

### Schema
```sql
CREATE TABLE public.ai_settings (
  id text PRIMARY KEY DEFAULT 'default',
  enabled boolean DEFAULT false,
  provider text CHECK (provider IN ('gemini', 'openai', 'custom')),
  model_name text,
  api_key text, -- In production, use secrets/vault
  credentials jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);
```
