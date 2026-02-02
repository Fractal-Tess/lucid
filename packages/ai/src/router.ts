/**
 * LLM Router
 *
 * Routes requests to appropriate models via OpenRouter API with automatic fallback.
 */

import { z } from 'zod';

import {
  type ModelConfig,
  type TaskType,
  routerConfig,
  getModelForTask,
} from './router.config.js';

/** OpenRouter API base URL */
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/** Message role types */
export type MessageRole = 'system' | 'user' | 'assistant';

/** Chat message */
export interface Message {
  role: MessageRole;
  content: string;
}

/** Request options for the router */
export interface RouterRequest {
  /** Task type for model selection */
  task: TaskType;
  /** Messages to send */
  messages: Message[];
  /** Optional complexity score (0-1) for routing decisions */
  complexity?: number;
  /** Maximum tokens for response */
  maxTokens?: number;
  /** Temperature for generation */
  temperature?: number;
  /** Optional specific model override */
  modelOverride?: string;
}

/** Response from the router */
export interface RouterResponse {
  /** Generated content */
  content: string;
  /** Model that was used */
  model: string;
  /** Usage statistics */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Whether fallback was used */
  usedFallback: boolean;
  /** Original model if fallback was used */
  originalModel?: string;
}

/** OpenRouter API response schema */
const openRouterResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string(),
      }),
    }),
  ),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }),
  model: z.string(),
});

/** Error from OpenRouter API */
export class RouterError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public modelId?: string,
  ) {
    super(message);
    this.name = 'RouterError';
  }
}

/**
 * LLM Router class for managing model routing and fallbacks
 */
export class LLMRouter {
  private apiKey: string;
  private siteUrl?: string;
  private siteName?: string;

  constructor(options: {
    apiKey: string;
    siteUrl?: string;
    siteName?: string;
  }) {
    this.apiKey = options.apiKey;
    this.siteUrl = options.siteUrl;
    this.siteName = options.siteName;
  }

  /**
   * Send a request to OpenRouter API
   */
  private async callOpenRouter(
    model: ModelConfig,
    messages: Message[],
    options: { maxTokens?: number; temperature?: number },
  ): Promise<RouterResponse> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    if (this.siteUrl) {
      headers['HTTP-Referer'] = this.siteUrl;
    }
    if (this.siteName) {
      headers['X-Title'] = this.siteName;
    }

    const body = {
      model: model.model,
      messages,
      max_tokens: options.maxTokens ?? model.maxTokens,
      temperature: options.temperature ?? 0.7,
    };

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new RouterError(
        `OpenRouter API error: ${errorText}`,
        response.status,
        model.id,
      );
    }

    const data = await response.json();
    const parsed = openRouterResponseSchema.parse(data);

    return {
      content: parsed.choices[0]?.message.content ?? '',
      model: parsed.model,
      usage: {
        promptTokens: parsed.usage.prompt_tokens,
        completionTokens: parsed.usage.completion_tokens,
        totalTokens: parsed.usage.total_tokens,
      },
      usedFallback: false,
    };
  }

  /**
   * Route a request with automatic fallback on failure
   */
  async route(request: RouterRequest): Promise<RouterResponse> {
    // Determine which model to use
    let model: ModelConfig;
    if (request.modelOverride) {
      const overrideModel = routerConfig.models[request.modelOverride];
      if (!overrideModel) {
        throw new RouterError(
          `Unknown model override: ${request.modelOverride}`,
        );
      }
      model = overrideModel;
    } else {
      model = getModelForTask(request.task, request.complexity);
    }

    const originalModelId = model.id;

    // Try the primary model
    try {
      return await this.callOpenRouter(model, request.messages, {
        maxTokens: request.maxTokens,
        temperature: request.temperature,
      });
    } catch (error) {
      // If model override was specified, don't fallback
      if (request.modelOverride) {
        throw error;
      }

      // Try fallback chain
      const fallbackModels = routerConfig.fallbackChain.filter(
        (id) => id !== originalModelId,
      );

      for (const fallbackId of fallbackModels) {
        const fallbackModel = routerConfig.models[fallbackId];
        if (!fallbackModel) continue;

        try {
          const response = await this.callOpenRouter(
            fallbackModel,
            request.messages,
            {
              maxTokens: request.maxTokens,
              temperature: request.temperature,
            },
          );
          return {
            ...response,
            usedFallback: true,
            originalModel: originalModelId,
          };
        } catch {
          // Continue to next fallback
          continue;
        }
      }

      // All fallbacks failed
      throw new RouterError(
        `All models failed. Original error: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        originalModelId,
      );
    }
  }

  /**
   * Simple completion helper
   */
  async complete(
    task: TaskType,
    systemPrompt: string,
    userPrompt: string,
    options?: {
      complexity?: number;
      maxTokens?: number;
      temperature?: number;
    },
  ): Promise<string> {
    const response = await this.route({
      task,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      ...options,
    });
    return response.content;
  }
}

/**
 * Create a router instance with environment variables
 */
export function createRouter(options?: {
  apiKey?: string;
  siteUrl?: string;
  siteName?: string;
}): LLMRouter {
  const apiKey = options?.apiKey ?? process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is required');
  }

  return new LLMRouter({
    apiKey,
    siteUrl: options?.siteUrl ?? process.env.PUBLIC_APP_URL,
    siteName: options?.siteName ?? 'Alpha',
  });
}
