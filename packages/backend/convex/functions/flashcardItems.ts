import { v } from 'convex/values';

import { mutation, query } from '../_generated/server';

/**
 * SM-2 Algorithm Constants
 */
const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;

/**
 * SM-2 Algorithm Input
 */
interface SM2Input {
  quality: number; // 0-5 rating (0-2 = fail, 3-5 = pass)
  easeFactor: number; // Current ease factor
  interval: number; // Current interval in days
  repetitions: number; // Current repetition count
}

/**
 * SM-2 Algorithm Output
 */
interface SM2Output {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: number; // Timestamp
}

/**
 * Calculate next review using SM-2 algorithm
 */
export function calculateSM2(input: SM2Input): SM2Output {
  const { quality, easeFactor, interval, repetitions } = input;

  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }
    newRepetitions = repetitions + 1;
  } else {
    // Incorrect response - reset
    newRepetitions = 0;
    newInterval = 1;
  }

  // Update ease factor using SM-2 formula
  newEaseFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEaseFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor);

  const nextReview = Date.now() + newInterval * 24 * 60 * 60 * 1000;

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReview,
  };
}

/**
 * List all flashcard items for a generation
 */
export const listByGeneration = query({
  args: {
    generationId: v.id('generations'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('flashcardItems')
      .withIndex('by_generation', (q) =>
        q.eq('generationId', args.generationId),
      )
      .collect();
  },
});

/**
 * Get cards due for review (nextReview <= now)
 */
export const getDueCards = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const limit = args.limit ?? 50;

    const cards = await ctx.db
      .query('flashcardItems')
      .withIndex('by_user_next_review', (q) =>
        q.eq('userId', args.userId).lte('nextReview', now),
      )
      .take(limit);

    return cards;
  },
});

/**
 * Get a single flashcard item by ID
 */
export const get = query({
  args: {
    id: v.id('flashcardItems'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Create a new flashcard item
 */
export const create = mutation({
  args: {
    generationId: v.id('generations'),
    userId: v.id('users'),
    question: v.string(),
    answer: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify generation exists and is of type flashcards
    const generation = await ctx.db.get(args.generationId);
    if (!generation) {
      throw new Error('Generation not found');
    }
    if (generation.type !== 'flashcards') {
      throw new Error('Generation is not a flashcard generation');
    }

    const now = Date.now();
    const id = await ctx.db.insert('flashcardItems', {
      generationId: args.generationId,
      userId: args.userId,
      question: args.question,
      answer: args.answer,
      order: args.order,
      easeFactor: DEFAULT_EASE_FACTOR,
      interval: 0,
      repetitions: 0,
      nextReview: now, // Due immediately
      createdAt: now,
    });

    return id;
  },
});

/**
 * Batch create flashcard items (for AI generation)
 */
export const createBatch = mutation({
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
    // Verify generation exists and is of type flashcards
    const generation = await ctx.db.get(args.generationId);
    if (!generation) {
      throw new Error('Generation not found');
    }
    if (generation.type !== 'flashcards') {
      throw new Error('Generation is not a flashcard generation');
    }

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
        easeFactor: DEFAULT_EASE_FACTOR,
        interval: 0,
        repetitions: 0,
        nextReview: now, // Due immediately
        createdAt: now,
      });
      ids.push(id);
    }

    return ids;
  },
});

/**
 * Update flashcard content
 */
export const update = mutation({
  args: {
    id: v.id('flashcardItems'),
    question: v.optional(v.string()),
    answer: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error('Flashcard item not found');
    }

    const updates: { question?: string; answer?: string } = {};
    if (args.question !== undefined) updates.question = args.question;
    if (args.answer !== undefined) updates.answer = args.answer;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

/**
 * Record a review and update SM-2 values
 */
export const recordReview = mutation({
  args: {
    id: v.id('flashcardItems'),
    quality: v.number(), // 0-5 rating
  },
  handler: async (ctx, args) => {
    if (args.quality < 0 || args.quality > 5) {
      throw new Error('Quality must be between 0 and 5');
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error('Flashcard item not found');
    }

    const sm2Result = calculateSM2({
      quality: args.quality,
      easeFactor: existing.easeFactor,
      interval: existing.interval,
      repetitions: existing.repetitions,
    });

    await ctx.db.patch(args.id, {
      easeFactor: sm2Result.easeFactor,
      interval: sm2Result.interval,
      repetitions: sm2Result.repetitions,
      nextReview: sm2Result.nextReview,
    });

    return {
      id: args.id,
      nextReview: sm2Result.nextReview,
      interval: sm2Result.interval,
    };
  },
});

/**
 * Reorder flashcard items within a generation
 */
export const reorder = mutation({
  args: {
    generationId: v.id('generations'),
    orderedIds: v.array(v.id('flashcardItems')),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      const id = args.orderedIds[i];
      if (!id) continue;

      const item = await ctx.db.get(id);
      if (!item || item.generationId !== args.generationId) {
        throw new Error(`Invalid flashcard item: ${id}`);
      }

      await ctx.db.patch(id, { order: i });
    }

    return args.orderedIds;
  },
});

/**
 * Remove a flashcard item
 */
export const remove = mutation({
  args: {
    id: v.id('flashcardItems'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error('Flashcard item not found');
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});
