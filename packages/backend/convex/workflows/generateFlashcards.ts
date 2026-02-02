import type { Id } from '../_generated/dataModel';

import { v } from 'convex/values';
import { z } from 'zod';

import { api, internal } from '../_generated/api';
import { action, internalMutation, internalQuery } from '../_generated/server';

/**
 * Document type for generation
 */
interface DocumentForGeneration {
  _id: Id<'documents'>;
  name: string;
  extractedText?: string;
}

/**
 * OpenRouter API Configuration
 */
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'deepseek/deepseek-chat';

/**
 * System prompt for flashcard generation
 */
const FLASHCARD_SYSTEM_PROMPT = `You are an expert educator creating flashcards for students.

Your task is to extract the most important concepts from the provided text and create flashcards that will help students learn and remember the material.

Guidelines for creating flashcards:
1. Each flashcard should focus on ONE concept or fact
2. Questions should be clear and specific
3. Answers should be concise but complete
4. Use active recall principles - questions should require thinking, not just recognition
5. Cover the most important concepts first
6. Create flashcards that test understanding, not just memorization
7. For definitions, put the term on the question side and definition on the answer side
8. For processes/steps, create cards for each step
9. For comparisons, create cards that highlight differences

You must respond with a JSON array of flashcard objects. Each object must have:
- "question": The question or prompt (string)
- "answer": The answer or response (string)

Example output format:
[
  {"question": "What is photosynthesis?", "answer": "The process by which plants convert sunlight, water, and carbon dioxide into glucose and oxygen."},
  {"question": "What are the two stages of photosynthesis?", "answer": "The light-dependent reactions (in thylakoid membranes) and the Calvin cycle (in the stroma)."}
]

IMPORTANT: Return ONLY the JSON array, no markdown code blocks or additional text.`;

/**
 * Schema for validating AI response
 */
const flashcardResponseSchema = z.array(
  z.object({
    question: z.string().min(1),
    answer: z.string().min(1),
  }),
);

/**
 * Get document data for generation (internal)
 */
export const getDocumentsForGeneration = internalQuery({
  args: {
    documentIds: v.array(v.id('documents')),
  },
  handler: async (ctx, args): Promise<DocumentForGeneration[]> => {
    const documents: DocumentForGeneration[] = [];
    for (const docId of args.documentIds) {
      const doc = await ctx.db.get(docId);
      if (doc) {
        documents.push({
          _id: doc._id,
          name: doc.name,
          extractedText: doc.extractedText,
        });
      }
    }
    return documents;
  },
});

/**
 * Update generation status (internal)
 */
export const updateGenerationStatus = internalMutation({
  args: {
    generationId: v.id('generations'),
    status: v.union(
      v.literal('generating'),
      v.literal('ready'),
      v.literal('failed'),
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.generationId, {
      status: args.status,
      error: args.error,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Create flashcard items batch (internal)
 */
export const createFlashcardItems = internalMutation({
  args: {
    generationId: v.id('generations'),
    userId: v.id('users'),
    items: v.array(
      v.object({
        question: v.string(),
        answer: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ids: string[] = [];

    for (let i = 0; i < args.items.length; i++) {
      const item = args.items[i];
      if (!item) continue;

      const id = await ctx.db.insert('flashcardItems', {
        generationId: args.generationId,
        userId: args.userId,
        question: item.question,
        answer: item.answer,
        order: i,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: now,
        createdAt: now,
      });
      ids.push(id);
    }

    return ids;
  },
});

/**
 * Call OpenRouter API to generate flashcards
 */
async function callOpenRouter(
  apiKey: string,
  documentText: string,
  options?: { maxTokens?: number; temperature?: number },
): Promise<Array<{ question: string; answer: string }>> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: FLASHCARD_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Create flashcards from the following document content:\n\n${documentText}`,
        },
      ],
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${errorText}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = data.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No content in OpenRouter response');
  }

  // Parse JSON response
  let parsed: unknown;
  try {
    // Try to extract JSON from potential markdown code blocks
    let jsonString = content.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7);
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3);
    }
    if (jsonString.endsWith('```')) {
      jsonString = jsonString.slice(0, -3);
    }
    jsonString = jsonString.trim();

    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error(
      `Failed to parse AI response as JSON: ${content.slice(0, 200)}...`,
    );
  }

  // Validate response schema
  const validated = flashcardResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(`Invalid flashcard format: ${validated.error.message}`);
  }

  return validated.data;
}

/**
 * Generate flashcards from documents
 */
export const generateFlashcards = action({
  args: {
    generationId: v.id('generations'),
    userId: v.id('users'),
    documentIds: v.array(v.id('documents')),
  },
  handler: async (ctx, args) => {
    const updateStatus =
      internal.workflows.generateFlashcards.updateGenerationStatus;
    const getDocs =
      internal.workflows.generateFlashcards.getDocumentsForGeneration;
    const createItems =
      internal.workflows.generateFlashcards.createFlashcardItems;

    try {
      // Get documents
      const documents = await ctx.runQuery(getDocs, {
        documentIds: args.documentIds,
      });

      if (documents.length === 0) {
        throw new Error('No documents found');
      }

      // Combine extracted text from all documents
      const combinedText = documents
        .map((doc) => {
          if (!doc.extractedText) {
            throw new Error(`Document "${doc.name}" has no extracted text`);
          }
          return `=== ${doc.name} ===\n${doc.extractedText}`;
        })
        .join('\n\n');

      // Get API key from environment
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is not configured');
      }

      // Call AI to generate flashcards
      const flashcards = await callOpenRouter(apiKey, combinedText);

      if (flashcards.length === 0) {
        throw new Error('No flashcards generated');
      }

      // Create flashcard items
      await ctx.runMutation(createItems, {
        generationId: args.generationId,
        userId: args.userId,
        items: flashcards,
      });

      // Update generation status to ready
      await ctx.runMutation(updateStatus, {
        generationId: args.generationId,
        status: 'ready' as const,
      });

      return {
        success: true,
        generationId: args.generationId,
        flashcardCount: flashcards.length,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Update generation status to failed
      await ctx.runMutation(updateStatus, {
        generationId: args.generationId,
        status: 'failed' as const,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

/**
 * Get generation for retry (internal)
 */
export const getGenerationForRetry = internalQuery({
  args: {
    generationId: v.id('generations'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.generationId);
  },
});

/**
 * Retry failed flashcard generation
 */
export const retryGeneration = action({
  args: {
    generationId: v.id('generations'),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    success: boolean;
    generationId?: string;
    flashcardCount?: number;
    error?: string;
  }> => {
    // Get generation to verify it's failed and get data
    const generation = await ctx.runQuery(
      internal.workflows.generateFlashcards.getGenerationForRetry,
      { generationId: args.generationId },
    );

    if (!generation) {
      throw new Error('Generation not found');
    }

    if (generation.status !== 'failed') {
      throw new Error('Can only retry failed generations');
    }

    if (generation.type !== 'flashcards') {
      throw new Error('This action only handles flashcard generations');
    }

    // Reset status to generating
    await ctx.runMutation(
      internal.workflows.generateFlashcards.updateGenerationStatus,
      {
        generationId: args.generationId,
        status: 'generating' as const,
      },
    );

    // Run generation
    return await ctx.runAction(
      api.workflows.generateFlashcards.generateFlashcards,
      {
        generationId: args.generationId,
        userId: generation.userId,
        documentIds: generation.sourceDocumentIds,
      },
    );
  },
});
