import type { Id } from '../_generated/dataModel';

import { v } from 'convex/values';

import { mutation, query, type QueryCtx } from '../_generated/server';
import { authComponent } from '../auth';

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

function generateShareCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const createShareCode = mutation({
  args: {
    generationId: v.id('generations'),
    isPublic: v.boolean(),
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

    const existingShare = await ctx.db
      .query('sharedDecks')
      .withIndex('by_generation', (q) =>
        q.eq('generationId', args.generationId),
      )
      .first();

    if (existingShare) {
      await ctx.db.patch(existingShare._id, {
        isPublic: args.isPublic,
      });
      return existingShare.shareCode;
    }

    let shareCode = generateShareCode();
    let existing = await ctx.db
      .query('sharedDecks')
      .withIndex('by_share_code', (q) => q.eq('shareCode', shareCode))
      .first();

    while (existing) {
      shareCode = generateShareCode();
      existing = await ctx.db
        .query('sharedDecks')
        .withIndex('by_share_code', (q) => q.eq('shareCode', shareCode))
        .first();
    }

    await ctx.db.insert('sharedDecks', {
      generationId: args.generationId,
      ownerId: userId,
      shareCode,
      isPublic: args.isPublic,
      createdAt: Date.now(),
    });

    return shareCode;
  },
});

export const getShareInfo = query({
  args: {
    shareCode: v.string(),
  },
  handler: async (ctx, args) => {
    const sharedDeck = await ctx.db
      .query('sharedDecks')
      .withIndex('by_share_code', (q) => q.eq('shareCode', args.shareCode))
      .first();

    if (!sharedDeck) {
      return null;
    }

    const generation = await ctx.db.get(sharedDeck.generationId);
    if (!generation) {
      return null;
    }

    const owner = await ctx.db.get(sharedDeck.ownerId);

    return {
      shareCode: sharedDeck.shareCode,
      isPublic: sharedDeck.isPublic,
      generation: {
        id: generation._id,
        name: generation.name,
        type: generation.type,
        createdAt: generation.createdAt,
      },
      owner: owner
        ? {
            name: owner.name,
            email: owner.email,
          }
        : null,
    };
  },
});

export const importSharedGeneration = mutation({
  args: {
    shareCode: v.string(),
    targetFolderId: v.id('folders'),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const sharedDeck = await ctx.db
      .query('sharedDecks')
      .withIndex('by_share_code', (q) => q.eq('shareCode', args.shareCode))
      .first();

    if (!sharedDeck) {
      throw new Error('Invalid share code');
    }

    if (!sharedDeck.isPublic && sharedDeck.ownerId !== userId) {
      throw new Error('This deck is not public');
    }

    const sourceGeneration = await ctx.db.get(sharedDeck.generationId);
    if (!sourceGeneration) {
      throw new Error('Source generation not found');
    }

    const targetFolder = await ctx.db.get(args.targetFolderId);
    if (!targetFolder) {
      throw new Error('Target folder not found');
    }
    if (targetFolder.userId !== userId) {
      throw new Error('Target folder does not belong to user');
    }

    const now = Date.now();
    const newGenerationId = await ctx.db.insert('generations', {
      userId,
      folderId: args.targetFolderId,
      sourceDocumentIds: [],
      name: `${sourceGeneration.name} (Imported)`,
      type: sourceGeneration.type,
      status: 'ready',
      createdAt: now,
      updatedAt: now,
    });

    if (sourceGeneration.type === 'flashcards') {
      const flashcardItems = await ctx.db
        .query('flashcardItems')
        .withIndex('by_generation', (q) =>
          q.eq('generationId', sharedDeck.generationId),
        )
        .collect();

      for (const item of flashcardItems) {
        await ctx.db.insert('flashcardItems', {
          generationId: newGenerationId,
          userId,
          question: item.question,
          answer: item.answer,
          order: item.order,
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReview: now,
          createdAt: now,
        });
      }
    } else if (sourceGeneration.type === 'quiz') {
      const quizItems = await ctx.db
        .query('quizItems')
        .withIndex('by_generation', (q) =>
          q.eq('generationId', sharedDeck.generationId),
        )
        .collect();

      for (const item of quizItems) {
        await ctx.db.insert('quizItems', {
          generationId: newGenerationId,
          userId,
          question: item.question,
          options: item.options,
          correctIndex: item.correctIndex,
          explanation: item.explanation,
          order: item.order,
          createdAt: now,
        });
      }
    } else if (sourceGeneration.type === 'notes') {
      const notesContent = await ctx.db
        .query('notesContent')
        .withIndex('by_generation', (q) =>
          q.eq('generationId', sharedDeck.generationId),
        )
        .first();

      if (notesContent) {
        await ctx.db.insert('notesContent', {
          generationId: newGenerationId,
          userId,
          content: notesContent.content,
          keyPoints: notesContent.keyPoints,
          createdAt: now,
          updatedAt: now,
        });
      }
    } else if (sourceGeneration.type === 'summary') {
      const summaryContent = await ctx.db
        .query('summaryContent')
        .withIndex('by_generation', (q) =>
          q.eq('generationId', sharedDeck.generationId),
        )
        .first();

      if (summaryContent) {
        await ctx.db.insert('summaryContent', {
          generationId: newGenerationId,
          userId,
          content: summaryContent.content,
          sections: summaryContent.sections,
          createdAt: now,
        });
      }
    }

    return newGenerationId;
  },
});

export const updateShareVisibility = mutation({
  args: {
    generationId: v.id('generations'),
    isPublic: v.boolean(),
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

    const sharedDeck = await ctx.db
      .query('sharedDecks')
      .withIndex('by_generation', (q) =>
        q.eq('generationId', args.generationId),
      )
      .first();

    if (!sharedDeck) {
      throw new Error('Share code not found for this generation');
    }

    await ctx.db.patch(sharedDeck._id, {
      isPublic: args.isPublic,
    });

    return sharedDeck.shareCode;
  },
});

export const revokeShareCode = mutation({
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

    const sharedDeck = await ctx.db
      .query('sharedDecks')
      .withIndex('by_generation', (q) =>
        q.eq('generationId', args.generationId),
      )
      .first();

    if (!sharedDeck) {
      throw new Error('Share code not found for this generation');
    }

    await ctx.db.delete(sharedDeck._id);
  },
});

export const getMySharedGenerations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return [];
    }

    const sharedDecks = await ctx.db
      .query('sharedDecks')
      .withIndex('by_owner', (q) => q.eq('ownerId', userId))
      .collect();

    const result = [];
    for (const sharedDeck of sharedDecks) {
      const generation = await ctx.db.get(sharedDeck.generationId);
      if (generation) {
        result.push({
          shareCode: sharedDeck.shareCode,
          isPublic: sharedDeck.isPublic,
          generation: {
            id: generation._id,
            name: generation.name,
            type: generation.type,
            createdAt: generation.createdAt,
          },
        });
      }
    }

    return result;
  },
});
