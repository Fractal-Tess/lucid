import type { Id } from '../_generated/dataModel';

import { v } from 'convex/values';

import {
  mutation,
  query,
  internalMutation,
  type QueryCtx,
} from '../_generated/server';
import { authComponent } from '../auth';

const generationType = v.union(
  v.literal('flashcards'),
  v.literal('quiz'),
  v.literal('notes'),
  v.literal('summary'),
  v.literal('study_guide'),
  v.literal('concept_map'),
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

export const startGeneration = mutation({
  args: {
    subjectId: v.id('subjects'),
    sourceDocumentIds: v.array(v.id('documents')),
    type: generationType,
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const subject = await ctx.db.get(args.subjectId);
    if (!subject) {
      throw new Error('Subject not found');
    }
    if (subject.userId !== userId) {
      throw new Error('Subject does not belong to user');
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
    const generationId = await ctx.db.insert('generations', {
      userId,
      subjectId: args.subjectId,
      sourceDocumentIds: args.sourceDocumentIds,
      name: args.name,
      type: args.type,
      status: 'generating',
      createdAt: now,
      updatedAt: now,
    });

    return generationId;
  },
});

export const retryGeneration = mutation({
  args: {
    generationId: v.id('generations'),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const generation = await ctx.db.get(args.generationId);
    if (!generation) {
      throw new Error('Generation not found');
    }
    if (generation.userId !== userId) {
      throw new Error('Generation does not belong to user');
    }

    await ctx.db.patch(args.generationId, {
      status: 'generating',
      error: undefined,
      updatedAt: Date.now(),
    });

    return args.generationId;
  },
});

export const getGenerationStatus = query({
  args: {
    generationId: v.id('generations'),
  },
  handler: async (ctx, args) => {
    const generation = await ctx.db.get(args.generationId);
    if (!generation) {
      throw new Error('Generation not found');
    }

    return {
      status: generation.status,
      error: generation.error,
      updatedAt: generation.updatedAt,
    };
  },
});

export const updateGenerationStatus = internalMutation({
  args: {
    generationId: v.id('generations'),
    status: v.union(
      v.literal('generating'),
      v.literal('ready'),
      v.literal('failed'),
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
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

    await ctx.db.patch(args.generationId, updates);
  },
});
