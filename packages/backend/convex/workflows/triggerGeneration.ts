import { v } from 'convex/values';

import { api, internal } from '../_generated/api';
import { action } from '../_generated/server';

export const triggerGeneration = action({
  args: {
    generationId: v.id('generations'),
    type: v.union(
      v.literal('flashcards'),
      v.literal('quiz'),
      v.literal('notes'),
      v.literal('summary'),
      v.literal('study_guide'),
      v.literal('concept_map'),
    ),
  },
  handler: async (ctx, args) => {
    const getGeneration =
      internal.workflows.generateFlashcards.getGenerationForRetry;
    const updateStatus =
      internal.functions.generationWorkflow.updateGenerationStatus;

    try {
      const generation = await ctx.runQuery(getGeneration, {
        generationId: args.generationId,
      });

      if (!generation) {
        throw new Error('Generation not found');
      }

      let result;

      switch (args.type) {
        case 'flashcards':
          result = await ctx.runAction(
            api.workflows.generateFlashcards.generateFlashcards,
            {
              generationId: args.generationId,
              userId: generation.userId,
              documentIds: generation.sourceDocumentIds,
            },
          );
          break;

        case 'quiz':
          result = await ctx.runAction(
            api.workflows.generateQuiz.generateQuiz,
            {
              generationId: args.generationId,
              userId: generation.userId,
              documentIds: generation.sourceDocumentIds,
            },
          );
          break;

        case 'notes':
          result = await ctx.runAction(
            api.workflows.generateNotes.generateNotes,
            {
              generationId: args.generationId,
              userId: generation.userId,
              documentIds: generation.sourceDocumentIds,
            },
          );
          break;

        case 'summary':
          result = await ctx.runAction(
            api.workflows.generateSummary.generateSummary,
            {
              generationId: args.generationId,
              userId: generation.userId,
              documentIds: generation.sourceDocumentIds,
            },
          );
          break;

        default:
          throw new Error(
            `Generation type "${args.type}" is not yet implemented`,
          );
      }

      if (!result.success) {
        throw new Error(result.error || 'Generation failed');
      }

      return {
        success: true,
        generationId: args.generationId,
        type: args.type,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      await ctx.runMutation(updateStatus, {
        generationId: args.generationId,
        status: 'failed',
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});
