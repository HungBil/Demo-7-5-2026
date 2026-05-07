/**
 * Server-only environment variable handling.
 * NEVER import this file from client-side code.
 * API keys are validated lazily when the feature is used.
 */

/**
 * Get the Firecrawl API key.
 * Throws only when a crawler feature is invoked without the key.
 */
export function getFirecrawlApiKey(): string {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) {
    throw new Error(
      '[env] FIRECRAWL_API_KEY is not set. ' +
        'Add it to .env.local or Vercel environment variables.'
    );
  }
  return key;
}

/**
 * Get the OpenAI API key.
 * Throws only when the chatbot LLM feature is invoked without the key.
 */
export function getOpenAiApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      '[env] OPENAI_API_KEY is not set. ' +
        'Add it to .env.local or Vercel environment variables. ' +
        'The chatbot will fall back to search-result mode.'
    );
  }
  return key;
}

/**
 * Returns true if Notion MCP integration is enabled.
 */
export function isNotionMcpEnabled(): boolean {
  return process.env.NOTION_MCP_ENABLED === 'true';
}

/**
 * Public app name (safe for client).
 */
export function getAppName(): string {
  return process.env.NEXT_PUBLIC_APP_NAME ?? 'BQP Article Agent';
}
