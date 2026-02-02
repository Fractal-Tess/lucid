import { v } from 'convex/values';

import { mutation, query } from '../_generated/server';

/**
 * Get summary content by generation ID
 */
export const getByGeneration = query({
  args: {
    generationId: v.id('generations'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('summaryContent')
      .withIndex('by_generation', (q) =>
        q.eq('generationId', args.generationId),
      )
      .unique();
  },
});

/**
 * Get summary content by document ID
 * Note: This returns the most recent summary if multiple exist
 */
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
      .filter((q) => q.eq(q.field('type'), 'summary'))
      .order('desc')
      .first();

    if (!generation) {
      return null;
    }

    return await ctx.db
      .query('summaryContent')
      .withIndex('by_generation', (q) => q.eq('generationId', generation._id))
      .unique();
  },
});

/**
 * Create summary content
 */
export const create = mutation({
  args: {
    generationId: v.id('generations'),
    userId: v.id('users'),
    content: v.string(),
    sections: v.array(
      v.object({
        title: v.string(),
        content: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert('summaryContent', {
      generationId: args.generationId,
      userId: args.userId,
      content: args.content,
      sections: args.sections,
      createdAt: now,
    });
    return id;
  },
});

/**
 * Update summary content
 */
export const update = mutation({
  args: {
    id: v.id('summaryContent'),
    content: v.optional(v.string()),
    sections: v.optional(
      v.array(
        v.object({
          title: v.string(),
          content: v.string(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error('Summary content not found');
    }

    const updates: {
      content?: string;
      sections?: { title: string; content: string }[];
    } = {};

    if (args.content !== undefined) updates.content = args.content;
    if (args.sections !== undefined) updates.sections = args.sections;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

/**
 * Delete summary content
 */
export const remove = mutation({
  args: {
    id: v.id('summaryContent'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error('Summary content not found');
    }
    await ctx.db.delete(args.id);
    return args.id;
  },
});
