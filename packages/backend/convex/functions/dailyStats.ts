import { v } from 'convex/values';

import { mutation, query } from '../_generated/server';

/**
 * Get daily stats for a user
 */
export const getByUser = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 30;

    const stats = await ctx.db
      .query('dailyStats')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit);

    return stats;
  },
});

/**
 * Get or create daily stats for today
 */
export const getToday = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];

    const stats = await ctx.db
      .query('dailyStats')
      .withIndex('by_user_date', (q) =>
        q.eq('userId', args.userId).eq('date', today),
      )
      .first();

    return stats;
  },
});

/**
 * Get daily stats for a specific date
 */
export const getByDate = query({
  args: {
    userId: v.id('users'),
    date: v.string(), // YYYY-MM-DD format
  },
  handler: async (ctx, args) => {
    const stats = await ctx.db
      .query('dailyStats')
      .withIndex('by_user_date', (q) =>
        q.eq('userId', args.userId).eq('date', args.date),
      )
      .first();

    return stats;
  },
});

/**
 * Record quiz completion (increments quizzesTaken and correctAnswers)
 */
export const recordQuiz = mutation({
  args: {
    userId: v.id('users'),
    correctAnswers: v.number(),
    studyTimeSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];

    // Get or create today's stats
    const existing = await ctx.db
      .query('dailyStats')
      .withIndex('by_user_date', (q) =>
        q.eq('userId', args.userId).eq('date', today),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        quizzesTaken: existing.quizzesTaken + 1,
        correctAnswers: existing.correctAnswers + args.correctAnswers,
        studyTimeSeconds: existing.studyTimeSeconds + args.studyTimeSeconds,
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert('dailyStats', {
        userId: args.userId,
        date: today,
        cardsStudied: 0,
        quizzesTaken: 1,
        correctAnswers: args.correctAnswers,
        studyTimeSeconds: args.studyTimeSeconds,
      });
      return id;
    }
  },
});

/**
 * Record flashcard study session (increments cardsStudied and correctAnswers)
 */
export const recordFlashcards = mutation({
  args: {
    userId: v.id('users'),
    cardsStudied: v.number(),
    correctAnswers: v.number(),
    studyTimeSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];

    // Get or create today's stats
    const existing = await ctx.db
      .query('dailyStats')
      .withIndex('by_user_date', (q) =>
        q.eq('userId', args.userId).eq('date', today),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        cardsStudied: existing.cardsStudied + args.cardsStudied,
        correctAnswers: existing.correctAnswers + args.correctAnswers,
        studyTimeSeconds: existing.studyTimeSeconds + args.studyTimeSeconds,
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert('dailyStats', {
        userId: args.userId,
        date: today,
        cardsStudied: args.cardsStudied,
        quizzesTaken: 0,
        correctAnswers: args.correctAnswers,
        studyTimeSeconds: args.studyTimeSeconds,
      });
      return id;
    }
  },
});

/**
 * Get stats summary for a date range
 */
export const getSummary = query({
  args: {
    userId: v.id('users'),
    startDate: v.string(), // YYYY-MM-DD format
    endDate: v.string(), // YYYY-MM-DD format
  },
  handler: async (ctx, args) => {
    const stats = await ctx.db
      .query('dailyStats')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    const filtered = stats.filter(
      (s) => s.date >= args.startDate && s.date <= args.endDate,
    );

    const totalCardsStudied = filtered.reduce(
      (sum, s) => sum + s.cardsStudied,
      0,
    );
    const totalQuizzesTaken = filtered.reduce(
      (sum, s) => sum + s.quizzesTaken,
      0,
    );
    const totalCorrectAnswers = filtered.reduce(
      (sum, s) => sum + s.correctAnswers,
      0,
    );
    const totalStudyTime = filtered.reduce(
      (sum, s) => sum + s.studyTimeSeconds,
      0,
    );

    return {
      totalCardsStudied,
      totalQuizzesTaken,
      totalCorrectAnswers,
      totalStudyTime,
      daysStudied: filtered.length,
      dailyStats: filtered,
    };
  },
});
