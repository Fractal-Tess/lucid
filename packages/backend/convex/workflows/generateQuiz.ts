import type { Id } from '../_generated/dataModel';

import { v } from 'convex/values';
import { z } from 'zod';

import { api, internal } from '../_generated/api';
import { action, internalMutation, internalQuery } from '../_generated/server';

interface DocumentForGeneration {
  _id: Id<'documents'>;
  name: string;
  extractedText?: string;
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'deepseek/deepseek-chat';

const QUIZ_SYSTEM_PROMPT = `You are an expert educator creating multiple-choice quizzes for students.

Your task is to extract the most important concepts from the provided text and create quiz questions that will help students test their understanding of the material.

Guidelines for creating quiz questions:
1. Each question should focus on ONE important concept or fact
2. Questions should be clear and unambiguous
3. Provide 4 answer options for each question (unless the question naturally has fewer possibilities)
4. Only ONE option should be correct
5. Incorrect options should be plausible but clearly wrong (distractors)
6. Include an explanation for why the correct answer is correct
7. Cover the most important concepts first
8. Test understanding, not just memorization
9. Use a mix of difficulty levels (easy recall questions + harder conceptual questions)
10. For definitions, ask to identify the term or define the concept
11. For processes, ask about steps, purpose, or order
12. For comparisons, ask to identify similarities or differences

You must respond with a JSON array of quiz objects. Each object must have:
- "question": The question (string)
- "options": Array of 4 answer choices (array of strings)
- "correctIndex": Index of the correct answer in the options array (number, 0-3)
- "explanation": Explanation of why the correct answer is correct (string, optional)

Example output format:
[
  {
    "question": "What is photosynthesis?",
    "options": ["A process of cellular respiration", "The process by which plants convert sunlight into energy", "A type of animal digestion", "The process of cell division"],
    "correctIndex": 1,
    "explanation": "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce glucose and oxygen."
  },
  {
    "question": "Which organelle is responsible for photosynthesis in plant cells?",
    "options": ["Mitochondria", "Nucleus", "Chloroplast", "Ribosome"],
    "correctIndex": 2,
    "explanation": "Chloroplasts contain chlorophyll and are the organelles where photosynthesis occurs."
  }
]

IMPORTANT: Return ONLY the JSON array, no markdown code blocks or additional text.`;

const quizResponseSchema = z.array(
  z.object({
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(2).max(4),
    correctIndex: z.number().int().min(0).max(3),
    explanation: z.string().optional(),
  }),
);

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

export const createQuizItems = internalMutation({
  args: {
    generationId: v.id('generations'),
    userId: v.id('users'),
    items: v.array(
      v.object({
        question: v.string(),
        options: v.array(v.string()),
        correctIndex: v.number(),
        explanation: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ids: string[] = [];

    for (let i = 0; i < args.items.length; i++) {
      const item = args.items[i];
      if (!item) continue;

      const id = await ctx.db.insert('quizItems', {
        generationId: args.generationId,
        userId: args.userId,
        question: item.question,
        options: item.options,
        correctIndex: item.correctIndex,
        explanation: item.explanation,
        order: i,
        createdAt: now,
      });
      ids.push(id);
    }

    return ids;
  },
});

async function callOpenRouter(
  apiKey: string,
  documentText: string,
  options?: { maxTokens?: number; temperature?: number },
): Promise<
  Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  }>
> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: QUIZ_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Create quiz questions from the following document content:\n\n${documentText}`,
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

  let parsed: unknown;
  try {
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

  const validated = quizResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(`Invalid quiz format: ${validated.error.message}`);
  }

  return validated.data;
}

export const generateQuiz = action({
  args: {
    generationId: v.id('generations'),
    userId: v.id('users'),
    documentIds: v.array(v.id('documents')),
  },
  handler: async (ctx, args) => {
    const updateStatus = internal.workflows.generateQuiz.updateGenerationStatus;
    const getDocs = internal.workflows.generateQuiz.getDocumentsForGeneration;
    const createItems = internal.workflows.generateQuiz.createQuizItems;

    try {
      const documents = await ctx.runQuery(getDocs, {
        documentIds: args.documentIds,
      });

      if (documents.length === 0) {
        throw new Error('No documents found');
      }

      const combinedText = documents
        .map((doc: DocumentForGeneration) => {
          if (!doc.extractedText) {
            throw new Error(`Document "${doc.name}" has no extracted text`);
          }
          return `=== ${doc.name} ===\n${doc.extractedText}`;
        })
        .join('\n\n');

      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is not configured');
      }

      const quizzes = await callOpenRouter(apiKey, combinedText);

      if (quizzes.length === 0) {
        throw new Error('No quiz questions generated');
      }

      await ctx.runMutation(createItems, {
        generationId: args.generationId,
        userId: args.userId,
        items: quizzes,
      });

      await ctx.runMutation(updateStatus, {
        generationId: args.generationId,
        status: 'ready' as const,
      });

      return {
        success: true,
        generationId: args.generationId,
        quizCount: quizzes.length,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

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

export const getGenerationForRetry = internalQuery({
  args: {
    generationId: v.id('generations'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.generationId);
  },
});

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
    quizCount?: number;
    error?: string;
  }> => {
    const generation = await ctx.runQuery(
      internal.workflows.generateQuiz.getGenerationForRetry,
      {
        generationId: args.generationId,
      },
    );

    if (!generation) {
      throw new Error('Generation not found');
    }

    if (generation.status !== 'failed') {
      throw new Error('Can only retry failed generations');
    }

    if (generation.type !== 'quiz') {
      throw new Error('This action only handles quiz generations');
    }

    await ctx.runMutation(
      internal.workflows.generateQuiz.updateGenerationStatus,
      {
        generationId: args.generationId,
        status: 'generating' as const,
      },
    );

    return await ctx.runAction(api.workflows.generateQuiz.generateQuiz, {
      generationId: args.generationId,
      userId: generation.userId,
      documentIds: generation.sourceDocumentIds,
    });
  },
});
