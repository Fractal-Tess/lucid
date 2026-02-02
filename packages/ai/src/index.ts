/**
 * @alpha/ai - LLM Router and AI utilities for the Alpha study app
 */

// Router exports
export { LLMRouter, createRouter, RouterError } from './router.js';
export type {
  Message,
  MessageRole,
  RouterRequest,
  RouterResponse,
} from './router.js';

// Configuration exports
export {
  routerConfig,
  getModelConfig,
  getModelForTask,
} from './router.config.js';
export type {
  ModelConfig,
  RoutingRule,
  RouterConfig,
  TaskType,
} from './router.config.js';

// Classifier exports
export { classifyComplexity, estimateComplexity } from './classifier.js';
export type { ComplexityResult } from './classifier.js';
