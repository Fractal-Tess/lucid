import { v } from 'convex/values';

import { query } from '../_generated/server';
import { authComponent } from '../auth';

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
