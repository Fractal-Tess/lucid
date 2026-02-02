import { v } from 'convex/values';

import { mutation, query } from '../_generated/server';

/**
 * List all quiz items for a generation
 */
export const listByGeneration = query({
  args: {
    generationId: v.id('generations'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('quizItems')
      .withIndex('by_generation', (q) =>
        q.eq('generationId', args.generationId),
      )
      .collect();
  },
});

/**
 * Get a single quiz item by ID
 */
export const get = query({
  args: {
    id: v.id('quizItems'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Create a new quiz item
 */
export const create = mutation({
  args: {
    generationId: v.id('generations'),
    userId: v.id('users'),
    question: v.string(),
    options: v.array(v.string()),
    correctIndex: v.number(),
    explanation: v.optional(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify generation exists and is of type quiz
    const generation = await ctx.db.get(args.generationId);
    if (!generation) {
      throw new Error('Generation not found');
    }
    if (generation.type !== 'quiz') {
      throw new Error('Generation is not a quiz generation');
    }

    // Validate options and correctIndex
    if (args.options.length < 2) {
      throw new Error('Quiz must have at least 2 options');
    }
    if (args.correctIndex < 0 || args.correctIndex >= args.options.length) {
      throw new Error('Correct index is out of bounds');
    }

    const now = Date.now();
    const id = await ctx.db.insert('quizItems', {
      generationId: args.generationId,
      userId: args.userId,
      question: args.question,
      options: args.options,
      correctIndex: args.correctIndex,
      explanation: args.explanation,
      order: args.order,
      createdAt: now,
    });

    return id;
  },
});

/**
 * Batch create quiz items (for AI generation)
 */
export const createBatch = mutation({
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
    // Verify generation exists and is of type quiz
    const generation = await ctx.db.get(args.generationId);
    if (!generation) {
      throw new Error('Generation not found');
    }
    if (generation.type !== 'quiz') {
      throw new Error('Generation is not a quiz generation');
    }

    const now = Date.now();
    const ids: string[] = [];

    for (let i = 0; i < args.items.length; i++) {
      const item = args.items[i];
      if (!item) continue;

      // Validate options and correctIndex for each item
      if (item.options.length < 2) {
        throw new Error(`Quiz item ${i} must have at least 2 options`);
      }
      if (item.correctIndex < 0 || item.correctIndex >= item.options.length) {
        throw new Error(`Quiz item ${i} has correct index out of bounds`);
      }

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

/**
 * Update quiz item content
 */
export const update = mutation({
  args: {
    id: v.id('quizItems'),
    question: v.optional(v.string()),
    options: v.optional(v.array(v.string())),
    correctIndex: v.optional(v.number()),
    explanation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error('Quiz item not found');
    }

    const updates: {
      question?: string;
      options?: string[];
      correctIndex?: number;
      explanation?: string | undefined;
    } = {};

    if (args.question !== undefined) updates.question = args.question;
    if (args.options !== undefined) updates.options = args.options;
    if (args.correctIndex !== undefined) {
      updates.correctIndex = args.correctIndex;
      // Validate correctIndex if options are provided
      if (updates.options && updates.correctIndex >= updates.options.length) {
        throw new Error('Correct index is out of bounds');
      }
    }
    if (args.explanation !== undefined) updates.explanation = args.explanation;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

/**
 * Reorder quiz items within a generation
 */
export const reorder = mutation({
  args: {
    generationId: v.id('generations'),
    orderedIds: v.array(v.id('quizItems')),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      const id = args.orderedIds[i];
      if (!id) continue;

      const item = await ctx.db.get(id);
      if (!item || item.generationId !== args.generationId) {
        throw new Error(`Invalid quiz item: ${id}`);
      }

      await ctx.db.patch(id, { order: i });
    }

    return args.orderedIds;
  },
});

/**
 * Remove a quiz item
 */
export const remove = mutation({
  args: {
    id: v.id('quizItems'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error('Quiz item not found');
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});
