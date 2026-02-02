import type { Id } from '../_generated/dataModel';

import { v } from 'convex/values';

import { mutation, query, type QueryCtx } from '../_generated/server';
import { authComponent } from '../auth';

/**
 * Get the current user's ID from our users table
 */
async function getCurrentUserId(ctx: QueryCtx): Promise<Id<'users'> | null> {
  try {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) return null;

    const user = await ctx.db
      .query('users')
      .withIndex('by_better_auth_id', (q) => q.eq('betterAuthId', authUser._id))
      .first();

    return user?._id ?? null;
  } catch {
    return null;
  }
}

export const list = query({
  args: {
    userId: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    const userId = args.userId ?? (await getCurrentUserId(ctx));
    if (!userId) return [];

    const groups = await ctx.db
      .query('subjectGroups')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    return groups.sort((a, b) => a.order - b.order);
  },
});

export const get = query({
  args: {
    id: v.id('subjectGroups'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    userId: v.id('users'),
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingGroups = await ctx.db
      .query('subjectGroups')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    const maxOrder = existingGroups.reduce(
      (max, g) => Math.max(max, g.order),
      -1,
    );

    const id = await ctx.db.insert('subjectGroups', {
      userId: args.userId,
      name: args.name,
      description: args.description,
      color: args.color,
      order: maxOrder + 1,
      createdAt: Date.now(),
    });

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id('subjectGroups'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error('Subject group not found');
    }

    const filteredUpdates: Partial<typeof existing> = {};
    if (updates.name !== undefined) filteredUpdates.name = updates.name;
    if (updates.description !== undefined)
      filteredUpdates.description = updates.description;
    if (updates.color !== undefined) filteredUpdates.color = updates.color;

    await ctx.db.patch(id, filteredUpdates);
    return id;
  },
});

export const remove = mutation({
  args: {
    id: v.id('subjectGroups'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error('Subject group not found');
    }

    const subjects = await ctx.db
      .query('subjects')
      .withIndex('by_group', (q) => q.eq('groupId', args.id))
      .collect();

    for (const subject of subjects) {
      await ctx.db.patch(subject._id, { groupId: undefined });
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const reorder = mutation({
  args: {
    userId: v.id('users'),
    orderedIds: v.array(v.id('subjectGroups')),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      const id = args.orderedIds[i];
      const group = await ctx.db.get(id);

      if (!group) {
        throw new Error(`Subject group ${id} not found`);
      }

      if (group.userId !== args.userId) {
        throw new Error("Unauthorized: Cannot reorder another user's groups");
      }

      await ctx.db.patch(id, { order: i });
    }

    return true;
  },
});
