import dotenv from "dotenv";
dotenv.config({ quiet: true });

export const config = {
  modelLive: process.env.SOUFFLEUR_MODEL_LIVE || "claude-haiku-4-5",
  modelCR: process.env.SOUFFLEUR_MODEL_CR || "claude-sonnet-5",
  hasAnthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
};
