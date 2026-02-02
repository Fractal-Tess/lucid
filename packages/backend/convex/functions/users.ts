import { v } from 'convex/values';

import { mutation, query } from '../_generated/server';
import { authComponent } from '../auth';

/**
 * Store the current Better Auth user in our users table if they don't exist
 */
export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) return null;

    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_better_auth_id', (q) => q.eq('betterAuthId', authUser._id))
      .first();

    if (existingUser) return existingUser._id;

    return await ctx.db.insert('users', {
      betterAuthId: authUser._id,
      email: authUser.email!,
      name: authUser.name,
      plan: 'free',
      createdAt: Date.now(),
    });
  },
});

/**
 * Get the current user from our users table (not Better Auth's user table)
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    let authUser;
    try {
      authUser = await authComponent.getAuthUser(ctx);
    } catch {
      // User is not authenticated
      return null;
    }
    if (!authUser) {
      return null;
    }

    // Look up our user by the Better Auth ID
    const user = await ctx.db
      .query('users')
      .withIndex('by_better_auth_id', (q) => q.eq('betterAuthId', authUser._id))
      .first();

    return user;
  },
});

/**
 * Get a user by their Convex ID
 */
export const getById = query({
  args: {
    id: v.id('users'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
