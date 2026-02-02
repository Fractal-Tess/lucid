/**
 * LLM Router Configuration
 *
 * Defines models, routing rules, and fallback chains for the AI router.
 */

/** Task types supported by the router */
export type TaskType =
  | 'flashcard'
  | 'quiz'
  | 'summary'
  | 'notes'
  | 'explain'
  | 'classify'
  | 'chat';

/** Model configuration for OpenRouter */
export interface ModelConfig {
  /** Unique identifier for this model config */
  id: string;
  /** Provider (always openrouter for now) */
  provider: 'openrouter';
  /** Model identifier on OpenRouter */
  model: string;
  /** Cost per 1k tokens in USD */
  costPer1kTokens: number;
  /** Maximum tokens for output */
  maxTokens: number;
}

/** Routing rule to match tasks to models */
export interface RoutingRule {
  /** Task type this rule applies to */
  task: TaskType;
  /** Optional condition (e.g., "complexity > 0.7") */
  condition?: string;
  /** Model ID to use when this rule matches */
  model: string;
}

/** Complete router configuration */
export interface RouterConfig {
  /** Model used for task classification */
  classifier: ModelConfig;
  /** Available models */
  models: Record<string, ModelConfig>;
  /** Default model when no rule matches */
  defaultModel: string;
  /** Fallback chain for error recovery */
  fallbackChain: string[];
  /** Routing rules in priority order */
  rules: RoutingRule[];
}

/** Default router configuration */
export const routerConfig: RouterConfig = {
  classifier: {
    id: 'classifier',
    provider: 'openrouter',
    model: 'deepseek/deepseek-chat',
    costPer1kTokens: 0.0001,
    maxTokens: 100,
  },

  models: {
    'deepseek-v3': {
      id: 'deepseek-v3',
      provider: 'openrouter',
      model: 'deepseek/deepseek-chat-v3',
      costPer1kTokens: 0.0002,
      maxTokens: 8192,
    },
    'deepseek-r1': {
      id: 'deepseek-r1',
      provider: 'openrouter',
      model: 'deepseek/deepseek-r1',
      costPer1kTokens: 0.001,
      maxTokens: 8192,
    },
    'claude-haiku': {
      id: 'claude-haiku',
      provider: 'openrouter',
      model: 'anthropic/claude-3-haiku',
      costPer1kTokens: 0.00025,
      maxTokens: 4096,
    },
    'claude-sonnet': {
      id: 'claude-sonnet',
      provider: 'openrouter',
      model: 'anthropic/claude-3.5-sonnet',
      costPer1kTokens: 0.003,
      maxTokens: 8192,
    },
  },

  defaultModel: 'deepseek-v3',

  fallbackChain: ['deepseek-v3', 'claude-haiku', 'claude-sonnet'],

  rules: [
    { task: 'classify', model: 'deepseek-v3' },
    { task: 'flashcard', model: 'deepseek-v3' },
    { task: 'quiz', model: 'deepseek-v3' },
    { task: 'summary', model: 'deepseek-v3' },
    { task: 'notes', model: 'deepseek-v3' },
    { task: 'chat', model: 'deepseek-v3' },
    { task: 'explain', condition: 'complexity > 0.7', model: 'claude-sonnet' },
    { task: 'explain', model: 'deepseek-v3' },
  ],
};

/**
 * Get model config by ID
 */
export function getModelConfig(modelId: string): ModelConfig | undefined {
  return routerConfig.models[modelId];
}

/**
 * Get the model to use for a given task and optional complexity score
 */
export function getModelForTask(
  task: TaskType,
  complexity?: number,
): ModelConfig {
  for (const rule of routerConfig.rules) {
    if (rule.task !== task) continue;

    // Check condition if present
    if (rule.condition) {
      const match = rule.condition.match(/complexity\s*([><=]+)\s*([\d.]+)/);
      if (match && complexity !== undefined) {
        const [, operator, threshold] = match;
        const thresholdNum = parseFloat(threshold!);

        let conditionMet = false;
        switch (operator) {
          case '>':
            conditionMet = complexity > thresholdNum;
            break;
          case '>=':
            conditionMet = complexity >= thresholdNum;
            break;
          case '<':
            conditionMet = complexity < thresholdNum;
            break;
          case '<=':
            conditionMet = complexity <= thresholdNum;
            break;
          case '=':
          case '==':
            conditionMet = complexity === thresholdNum;
            break;
        }

        if (!conditionMet) continue;
      } else {
        // Condition present but complexity not provided or invalid condition
        continue;
      }
    }

    // Rule matches
    const model = routerConfig.models[rule.model];
    if (model) return model;
  }

  // Fallback to default model
  const defaultModel = routerConfig.models[routerConfig.defaultModel];
  if (!defaultModel) {
    throw new Error(
      `Default model ${routerConfig.defaultModel} not configured`,
    );
  }
  return defaultModel;
}
