import type { Id } from '../_generated/dataModel';

import { v } from 'convex/values';

import { mutation, query, type QueryCtx } from '../_generated/server';
import { authComponent } from '../auth';

const generationType = v.union(
  v.literal('flashcards'),
  v.literal('quiz'),
  v.literal('notes'),
  v.literal('summary'),
  v.literal('study_guide'),
  v.literal('concept_map'),
);

const generationStatus = v.union(
  v.literal('generating'),
  v.literal('ready'),
  v.literal('failed'),
);

async function getCurrentUserId(ctx: QueryCtx): Promise<Id<'users'> | null> {
  let authUser;
  try {
    authUser = await authComponent.getAuthUser(ctx);
  } catch {
    return null;
  }
  if (!authUser) {
    return null;
  }

  const user = await ctx.db
    .query('users')
    .withIndex('by_better_auth_id', (q) => q.eq('betterAuthId', authUser._id))
    .first();

  return user?._id ?? null;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return [];
    }
    return await ctx.db
      .query('generations')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
  },
});

export const listByFolder = query({
  args: {
    folderId: v.id('folders'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('generations')
      .withIndex('by_folder', (q) => q.eq('folderId', args.folderId))
      .collect();
  },
});

export const listByType = query({
  args: {
    userId: v.id('users'),
    type: generationType,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('generations')
      .withIndex('by_type', (q) =>
        q.eq('userId', args.userId).eq('type', args.type),
      )
      .collect();
  },
});

export const get = query({
  args: {
    id: v.id('generations'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    folderId: v.id('folders'),
    sourceDocumentIds: v.array(v.id('documents')),
    name: v.string(),
    type: generationType,
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error('Unauthorized: User not authenticated');
    }

    for (const docId of args.sourceDocumentIds) {
      const doc = await ctx.db.get(docId);
      if (!doc) {
        throw new Error(`Document not found: ${docId}`);
      }
      if (doc.userId !== userId) {
        throw new Error('Document does not belong to user');
      }
      if (doc.status !== 'ready') {
        throw new Error(`Document ${doc.name} is not ready for processing`);
      }
    }

    const now = Date.now();
    const id = await ctx.db.insert('generations', {
      userId,
      folderId: args.folderId,
      sourceDocumentIds: args.sourceDocumentIds,
      name: args.name,
      type: args.type,
      status: 'generating',
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id('generations'),
    status: generationStatus,
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error('Generation not found');
    }

    const updates: {
      status: 'generating' | 'ready' | 'failed';
      updatedAt: number;
      error?: string;
    } = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.error !== undefined) {
      updates.error = args.error;
    }

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const update = mutation({
  args: {
    id: v.id('generations'),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error('Generation not found');
    }

    const updates: { name?: string; updatedAt: number } = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      updates.name = args.name;
    }

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const remove = mutation({
  args: {
    id: v.id('generations'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error('Generation not found');
    }

    if (existing.type === 'flashcards') {
      const flashcardItems = await ctx.db
        .query('flashcardItems')
        .withIndex('by_generation', (q) => q.eq('generationId', args.id))
        .collect();
      for (const item of flashcardItems) {
        await ctx.db.delete(item._id);
      }
    } else if (existing.type === 'quiz') {
      const quizItems = await ctx.db
        .query('quizItems')
        .withIndex('by_generation', (q) => q.eq('generationId', args.id))
        .collect();
      for (const item of quizItems) {
        await ctx.db.delete(item._id);
      }
    } else if (existing.type === 'notes') {
      const notesContent = await ctx.db
        .query('notesContent')
        .withIndex('by_generation', (q) => q.eq('generationId', args.id))
        .collect();
      for (const item of notesContent) {
        await ctx.db.delete(item._id);
      }
    } else if (existing.type === 'summary') {
      const summaryContent = await ctx.db
        .query('summaryContent')
        .withIndex('by_generation', (q) => q.eq('generationId', args.id))
        .collect();
      for (const item of summaryContent) {
        await ctx.db.delete(item._id);
      }
    } else if (existing.type === 'study_guide') {
      const studyGuideContent = await ctx.db
        .query('studyGuideContent')
        .withIndex('by_generation', (q) => q.eq('generationId', args.id))
        .collect();
      for (const item of studyGuideContent) {
        await ctx.db.delete(item._id);
      }
    } else if (existing.type === 'concept_map') {
      const conceptMapContent = await ctx.db
        .query('conceptMapContent')
        .withIndex('by_generation', (q) => q.eq('generationId', args.id))
        .collect();
      for (const item of conceptMapContent) {
        await ctx.db.delete(item._id);
      }
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});
