/**
 * AWS Bedrock Client Utility
 *
 * Shared Bedrock Runtime client for Claude model invocations via AWS Bedrock.
 * Used by the note generation service to call Claude Sonnet and Haiku models.
 *
 * Authentication: Uses standard AWS credential chain
 * (env vars AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY, or IAM role, or SSO profile).
 *
 * PHI handling: Transcript text IS sent to Bedrock (BAA required with AWS).
 * No PHI in logs, error messages, or request metadata.
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  type InvokeModelCommandInput,
} from "@aws-sdk/client-bedrock-runtime";
import { logger } from "@shared/logger.js";

/** Bedrock model IDs for the Claude models used in this application */
export const BEDROCK_MODELS = {
  /** Claude Sonnet 4.5 — used for clinical note assembly (high quality) */
  SONNET: "us.anthropic.claude-sonnet-4-5-20250929-v1:0",
  /** Claude Haiku 4.5 — used for fast section extraction */
  HAIKU: "us.anthropic.claude-haiku-4-5-20251001-v1:0",
} as const;

let _client: BedrockRuntimeClient | null = null;

/**
 * Get or create the singleton BedrockRuntimeClient.
 * Region is read from AWS_REGION env var (defaults to us-east-2).
 */
export function getBedrockClient(): BedrockRuntimeClient {
  if (!_client) {
    const region = process.env.AWS_REGION || "us-east-2";
    _client = new BedrockRuntimeClient({ region });
    logger.info("bedrock.client.init", { message: `Bedrock client initialized (region: ${region})` });
  }
  return _client;
}

/**
 * Reset the client singleton (for testing).
 */
export function resetBedrockClient(): void {
  _client = null;
}

/**
 * Invoke a Claude model on Bedrock and return the response text.
 *
 * Wraps the Bedrock InvokeModel API with the Claude-specific request format.
 * Handles response parsing and error logging (without PHI).
 */
export async function invokeBedrockClaude(options: {
  modelId: string;
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens: number;
  temperature?: number;
}): Promise<string> {
  const client = getBedrockClient();

  const requestBody = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: options.maxTokens,
    system: options.system,
    messages: options.messages,
    temperature: options.temperature ?? 0.3,
  };

  const input: InvokeModelCommandInput = {
    modelId: options.modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(requestBody),
  };

  const command = new InvokeModelCommand(input);

  try {
    const response = await client.send(command);

    const responseBody = JSON.parse(
      new TextDecoder().decode(response.body),
    ) as {
      content: Array<{ type: string; text?: string }>;
      stop_reason: string;
      usage: { input_tokens: number; output_tokens: number };
    };

    logger.info("bedrock.invoke.complete", {
      modelId: options.modelId,
      inputTokens: responseBody.usage?.input_tokens,
      outputTokens: responseBody.usage?.output_tokens,
      stopReason: responseBody.stop_reason,
    });

    const textBlock = responseBody.content.find((b) => b.type === "text");
    if (!textBlock?.text) {
      throw new Error("Bedrock Claude returned no text content in response");
    }

    return textBlock.text;
  } catch (error) {
    // Log error without PHI (no request body details)
    const message = error instanceof Error ? error.message : "Unknown Bedrock error";
    logger.info("bedrock.invoke.error", {
      modelId: options.modelId,
      error: message,
    });
    throw error;
  }
}
