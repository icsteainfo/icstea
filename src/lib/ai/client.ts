import "server-only";
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

// Claude APIクライアントのシングルトン。サーバー専用(ブラウザに鍵を露出させない)。
export function getAnthropicClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}
