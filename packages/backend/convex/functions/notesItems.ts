import { v } from 'convex/values';

import { mutation, query } from '../_generated/server';

export const getByGeneration = query({
  args: {
    generationId: v.id('generations'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('notesContent')
      .withIndex('by_generation', (q) =>
        q.eq('generationId', args.generationId),
      )
      .unique();
  },
});

export const getByDocument = query({
  args: {
    documentId: v.id('documents'),
  },
  handler: async (ctx, args) => {
    const generation = await ctx.db
      .query('generations')
      .withIndex('by_source_doc', (q) =>
        q.eq('sourceDocumentIds', [args.documentId]),
      )
      .filter((q) => q.eq(q.field('type'), 'notes'))
      .order('desc')
      .first();

    if (!generation) {
      return null;
    }

    return await ctx.db
      .query('notesContent')
      .withIndex('by_generation', (q) => q.eq('generationId', generation._id))
      .unique();
  },
});

export const create = mutation({
  args: {
    generationId: v.id('generations'),
    userId: v.id('users'),
    content: v.string(),
    keyPoints: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert('notesContent', {
      generationId: args.generationId,
      userId: args.userId,
      content: args.content,
      keyPoints: args.keyPoints,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id('notesContent'),
    content: v.optional(v.string()),
    keyPoints: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error('Notes content not found');
    }

    const updates: {
      content?: string;
      keyPoints?: string[];
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.content !== undefined) updates.content = args.content;
    if (args.keyPoints !== undefined) updates.keyPoints = args.keyPoints;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const remove = mutation({
  args: {
    id: v.id('notesContent'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error('Notes content not found');
    }
    await ctx.db.delete(args.id);
    return args.id;
  },
});
