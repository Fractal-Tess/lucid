import { v } from 'convex/values';

import { mutation, query } from '../_generated/server';

/**
 * Get current streak for a user
 */
export const get = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const streak = await ctx.db
      .query('streaks')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    return streak ?? null;
  },
});

/**
 * Record a study session and update streak
 * Called after completing any study activity (quiz, flashcards, etc.)
 */
export const recordStudy = mutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split('T')[0];

    const existing = await ctx.db
      .query('streaks')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (!existing) {
      const id = await ctx.db.insert('streaks', {
        userId: args.userId,
        currentStreak: 1,
        longestStreak: 1,
        lastStudyDate: today,
      });
      return id;
    }

    let currentStreak = existing.currentStreak;
    let longestStreak = existing.longestStreak;

    if (existing.lastStudyDate === today) {
      return existing._id;
    }

    if (existing.lastStudyDate === yesterday) {
      currentStreak = existing.currentStreak + 1;
    } else {
      currentStreak = 1;
    }

    if (currentStreak > existing.longestStreak) {
      longestStreak = currentStreak;
    }

    await ctx.db.patch(existing._id, {
      currentStreak,
      longestStreak,
      lastStudyDate: today,
    });

    return existing._id;
  },
});

/**
 * Reset streak (for testing or manual override)
 */
export const reset = mutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('streaks')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (!existing) {
      const id = await ctx.db.insert('streaks', {
        userId: args.userId,
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: '',
      });
      return id;
    }

    await ctx.db.patch(existing._id, {
      currentStreak: 0,
      lastStudyDate: '',
    });

    return existing._id;
  },
});

/**
 * Get or create streak record for a user
 */
export const getOrCreate = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('streaks')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (existing) {
      return existing;
    }

    return null;
  },
});
