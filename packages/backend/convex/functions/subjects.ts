import type { Id } from '../_generated/dataModel';

import { v } from 'convex/values';

import { mutation, query, type QueryCtx } from '../_generated/server';
import { authComponent } from '../auth';

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

    const subjects = await ctx.db
      .query('subjects')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    return subjects.sort((a, b) => a.order - b.order);
  },
});

export const listByGroup = query({
  args: {
    groupId: v.optional(v.id('subjectGroups')),
  },
  handler: async (ctx, args) => {
    const subjects = await ctx.db
      .query('subjects')
      .withIndex('by_group', (q) => q.eq('groupId', args.groupId))
      .collect();

    return subjects.sort((a, b) => a.order - b.order);
  },
});

export const listUngrouped = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const allSubjects = await ctx.db
      .query('subjects')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    const ungrouped = allSubjects.filter((s) => s.groupId === undefined);
    return ungrouped.sort((a, b) => a.order - b.order);
  },
});

export const get = query({
  args: {
    id: v.id('subjects'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    userId: v.id('users'),
    groupId: v.optional(v.id('subjectGroups')),
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingSubjects = await ctx.db
      .query('subjects')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    const sameGroupSubjects = existingSubjects.filter(
      (s) => s.groupId === args.groupId,
    );
    const maxOrder = sameGroupSubjects.reduce(
      (max, s) => Math.max(max, s.order),
      -1,
    );

    const id = await ctx.db.insert('subjects', {
      userId: args.userId,
      groupId: args.groupId,
      name: args.name,
      description: args.description,
      icon: args.icon,
      color: args.color,
      order: maxOrder + 1,
      createdAt: Date.now(),
    });

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id('subjects'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    groupId: v.optional(v.union(v.id('subjectGroups'), v.null())),
  },
  handler: async (ctx, args) => {
    const { id, groupId, ...updates } = args;

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error('Subject not found');
    }

    const filteredUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) filteredUpdates.name = updates.name;
    if (updates.description !== undefined)
      filteredUpdates.description = updates.description;
    if (updates.icon !== undefined) filteredUpdates.icon = updates.icon;
    if (updates.color !== undefined) filteredUpdates.color = updates.color;

    if (groupId !== undefined) {
      filteredUpdates.groupId = groupId === null ? undefined : groupId;
    }

    await ctx.db.patch(id, filteredUpdates);
    return id;
  },
});

export const remove = mutation({
  args: {
    id: v.id('subjects'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error('Subject not found');
    }

    const folders = await ctx.db
      .query('folders')
      .withIndex('by_subject', (q) => q.eq('subjectId', args.id))
      .collect();

    for (const folder of folders) {
      await ctx.db.delete(folder._id);
    }

    const documents = await ctx.db
      .query('documents')
      .withIndex('by_subject', (q) => q.eq('subjectId', args.id))
      .collect();

    for (const doc of documents) {
      await ctx.db.delete(doc._id);
    }

    const generations = await ctx.db
      .query('generations')
      .withIndex('by_subject', (q) => q.eq('subjectId', args.id))
      .collect();

    for (const gen of generations) {
      await ctx.db.delete(gen._id);
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const reorder = mutation({
  args: {
    userId: v.id('users'),
    groupId: v.optional(v.id('subjectGroups')),
    orderedIds: v.array(v.id('subjects')),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      const id = args.orderedIds[i];
      const subject = await ctx.db.get(id);

      if (!subject) {
        throw new Error(`Subject ${id} not found`);
      }

      if (subject.userId !== args.userId) {
        throw new Error("Unauthorized: Cannot reorder another user's subjects");
      }

      await ctx.db.patch(id, { order: i });
    }

    return true;
  },
});

export const moveToGroup = mutation({
  args: {
    id: v.id('subjects'),
    groupId: v.optional(v.id('subjectGroups')),
  },
  handler: async (ctx, args) => {
    const subject = await ctx.db.get(args.id);
    if (!subject) {
      throw new Error('Subject not found');
    }

    const targetGroupSubjects = await ctx.db
      .query('subjects')
      .withIndex('by_group', (q) => q.eq('groupId', args.groupId))
      .collect();

    const maxOrder = targetGroupSubjects.reduce(
      (max, s) => Math.max(max, s.order),
      -1,
    );

    await ctx.db.patch(args.id, {
      groupId: args.groupId,
      order: maxOrder + 1,
    });

    return args.id;
  },
});
