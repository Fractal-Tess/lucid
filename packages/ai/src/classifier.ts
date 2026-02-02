/**
 * Task Complexity Classifier
 *
 * Classifies task complexity to help with model routing decisions.
 */

import type { LLMRouter } from './router.js';

import { z } from 'zod';

/** Complexity classification result */
export interface ComplexityResult {
  /** Complexity score from 0 to 1 */
  score: number;
  /** Classification label */
  level: 'simple' | 'moderate' | 'complex';
  /** Reasoning for the classification */
  reasoning: string;
}

/** Schema for classifier response */
const classifierResponseSchema = z.object({
  score: z.number().min(0).max(1),
  level: z.enum(['simple', 'moderate', 'complex']),
  reasoning: z.string(),
});

/** System prompt for complexity classification */
const CLASSIFIER_SYSTEM_PROMPT = `You are a task complexity classifier. Analyze the given content and classify its complexity.

Consider these factors:
1. Length and density of the content
2. Technical terminology and jargon
3. Conceptual depth and abstraction level
4. Number of interconnected concepts
5. Required background knowledge

Respond with a JSON object containing:
- score: A number from 0 to 1 (0 = trivial, 1 = extremely complex)
- level: One of "simple", "moderate", or "complex"
- reasoning: Brief explanation of your classification

Only respond with valid JSON, no other text.`;

/**
 * Classify the complexity of content for routing decisions
 */
export async function classifyComplexity(
  router: LLMRouter,
  content: string,
): Promise<ComplexityResult> {
  // Truncate content if too long
  const truncatedContent =
    content.length > 5000 ? content.slice(0, 5000) + '...' : content;

  const response = await router.route({
    task: 'classify',
    messages: [
      { role: 'system', content: CLASSIFIER_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Classify the complexity of this content:\n\n${truncatedContent}`,
      },
    ],
    maxTokens: 200,
    temperature: 0.3,
  });

  try {
    const parsed = JSON.parse(response.content);
    return classifierResponseSchema.parse(parsed);
  } catch {
    // If parsing fails, return a default moderate complexity
    return {
      score: 0.5,
      level: 'moderate',
      reasoning:
        'Failed to parse classifier response, defaulting to moderate complexity.',
    };
  }
}

/**
 * Quick heuristic-based complexity estimation (no API call)
 *
 * Useful for initial routing when you want to avoid an extra API call.
 */
export function estimateComplexity(content: string): ComplexityResult {
  const factors: { score: number; weight: number }[] = [];

  // Factor 1: Content length
  const length = content.length;
  if (length < 500) {
    factors.push({ score: 0.2, weight: 1 });
  } else if (length < 2000) {
    factors.push({ score: 0.4, weight: 1 });
  } else if (length < 5000) {
    factors.push({ score: 0.6, weight: 1 });
  } else {
    factors.push({ score: 0.8, weight: 1 });
  }

  // Factor 2: Technical terms (basic heuristic)
  const technicalPatterns = [
    /\b(algorithm|theorem|equation|hypothesis|coefficient)\b/gi,
    /\b(neural|quantum|molecular|genomic|cryptographic)\b/gi,
    /\b(differential|integral|derivative|matrix|vector)\b/gi,
    /\b(protocol|architecture|implementation|framework)\b/gi,
  ];

  let technicalCount = 0;
  for (const pattern of technicalPatterns) {
    technicalCount += (content.match(pattern) || []).length;
  }

  const technicalScore = Math.min(technicalCount / 20, 1);
  factors.push({ score: technicalScore, weight: 1.5 });

  // Factor 3: Sentence complexity (average sentence length)
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentenceLength =
    sentences.reduce((acc, s) => acc + s.split(/\s+/).length, 0) /
    Math.max(sentences.length, 1);

  let sentenceScore: number;
  if (avgSentenceLength < 10) {
    sentenceScore = 0.2;
  } else if (avgSentenceLength < 20) {
    sentenceScore = 0.4;
  } else if (avgSentenceLength < 30) {
    sentenceScore = 0.6;
  } else {
    sentenceScore = 0.8;
  }
  factors.push({ score: sentenceScore, weight: 1 });

  // Factor 4: Presence of mathematical notation
  const mathPatterns = /[∑∏∫∂√∞≈≠≤≥±×÷]|[a-z]\^[0-9]|[a-z]_[a-z0-9]/gi;
  const hasMath = mathPatterns.test(content);
  factors.push({ score: hasMath ? 0.8 : 0.3, weight: 0.5 });

  // Calculate weighted average
  const totalWeight = factors.reduce((acc, f) => acc + f.weight, 0);
  const weightedSum = factors.reduce((acc, f) => acc + f.score * f.weight, 0);
  const score = weightedSum / totalWeight;

  // Determine level
  let level: 'simple' | 'moderate' | 'complex';
  if (score < 0.35) {
    level = 'simple';
  } else if (score < 0.65) {
    level = 'moderate';
  } else {
    level = 'complex';
  }

  return {
    score: Math.round(score * 100) / 100,
    level,
    reasoning: `Heuristic estimation based on content length (${length} chars), technical terminology density, sentence complexity, and mathematical notation.`,
  };
}
