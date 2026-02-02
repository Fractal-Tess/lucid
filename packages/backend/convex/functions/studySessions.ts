import { v } from 'convex/values';

import { mutation, query } from '../_generated/server';

/**
 * List all study sessions for a user
 */
export const listByUser = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const sessions = await ctx.db
      .query('studySessions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit);

    return sessions;
  },
});

/**
 * List study sessions for a specific document
 */
export const listByDocument = query({
  args: {
    documentId: v.id('documents'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('studySessions')
      .filter((q) => q.eq(q.field('documentId'), args.documentId))
      .collect();
  },
});

/**
 * Get study session statistics for a user
 */
export const getStats = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query('studySessions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    const totalSessions = sessions.length;
    const totalCardsStudied = sessions.reduce(
      (sum, s) => sum + s.cardsStudied,
      0,
    );
    const totalCorrectAnswers = sessions.reduce(
      (sum, s) => sum + s.correctAnswers,
      0,
    );
    const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);

    const byMode = sessions.reduce(
      (acc, s) => {
        if (!acc[s.mode]) {
          acc[s.mode] = {
            count: 0,
            cardsStudied: 0,
            correctAnswers: 0,
            duration: 0,
          };
        }
        acc[s.mode].count++;
        acc[s.mode].cardsStudied += s.cardsStudied;
        acc[s.mode].correctAnswers += s.correctAnswers;
        acc[s.mode].duration += s.duration;
        return acc;
      },
      {} as Record<
        string,
        {
          count: number;
          cardsStudied: number;
          correctAnswers: number;
          duration: number;
        }
      >,
    );

    return {
      totalSessions,
      totalCardsStudied,
      totalCorrectAnswers,
      totalDuration,
      byMode,
    };
  },
});

/**
 * Create a new study session
 */
export const create = mutation({
  args: {
    userId: v.id('users'),
    documentId: v.optional(v.id('documents')),
    mode: v.union(
      v.literal('flashcards'),
      v.literal('quiz'),
      v.literal('review'),
    ),
    cardsStudied: v.number(),
    correctAnswers: v.number(),
    duration: v.number(), // Seconds
  },
  handler: async (ctx, args) => {
    // Validate inputs
    if (args.cardsStudied < 0) {
      throw new Error('cardsStudied must be non-negative');
    }
    if (args.correctAnswers < 0) {
      throw new Error('correctAnswers must be non-negative');
    }
    if (args.correctAnswers > args.cardsStudied) {
      throw new Error('correctAnswers cannot exceed cardsStudied');
    }
    if (args.duration < 0) {
      throw new Error('duration must be non-negative');
    }

    const now = Date.now();
    const id = await ctx.db.insert('studySessions', {
      userId: args.userId,
      documentId: args.documentId,
      mode: args.mode,
      cardsStudied: args.cardsStudied,
      correctAnswers: args.correctAnswers,
      duration: args.duration,
      completedAt: now,
    });

    return id;
  },
});

/**
 * Record a quiz completion (convenience function)
 */
export const recordQuizCompletion = mutation({
  args: {
    userId: v.id('users'),
    documentId: v.optional(v.id('documents')),
    questionsAnswered: v.number(),
    correctAnswers: v.number(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    // Validate inputs
    if (args.questionsAnswered < 0) {
      throw new Error('questionsAnswered must be non-negative');
    }
    if (args.correctAnswers < 0) {
      throw new Error('correctAnswers must be non-negative');
    }
    if (args.correctAnswers > args.questionsAnswered) {
      throw new Error('correctAnswers cannot exceed questionsAnswered');
    }
    if (args.duration < 0) {
      throw new Error('duration must be non-negative');
    }

    const now = Date.now();
    const id = await ctx.db.insert('studySessions', {
      userId: args.userId,
      documentId: args.documentId,
      mode: 'quiz',
      cardsStudied: args.questionsAnswered,
      correctAnswers: args.correctAnswers,
      duration: args.duration,
      completedAt: now,
    });

    return id;
  },
});
