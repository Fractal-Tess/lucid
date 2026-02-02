import type { Id } from '../_generated/dataModel';

import { v } from 'convex/values';

import { query, type QueryCtx } from '../_generated/server';
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

type FlashcardExport = {
  question: string;
  answer: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: number;
};

type QuizExport = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

type NotesExport = {
  content: string;
  keyPoints: string[];
};

type SummaryExport = {
  content: string;
  sections: Array<{ title: string; content: string }>;
};

export const exportFlashcardsJSON = query({
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
    if (generation.type !== 'flashcards') {
      throw new Error('Generation is not flashcards');
    }

    const flashcardItems = await ctx.db
      .query('flashcardItems')
      .withIndex('by_generation', (q) =>
        q.eq('generationId', args.generationId),
      )
      .collect();

    const exportData = {
      name: generation.name,
      type: generation.type,
      createdAt: generation.createdAt,
      flashcards: flashcardItems.map((item) => ({
        question: item.question,
        answer: item.answer,
        easeFactor: item.easeFactor,
        interval: item.interval,
        repetitions: item.repetitions,
        nextReview: item.nextReview,
      })),
    };

    return JSON.stringify(exportData, null, 2);
  },
});

export const exportFlashcardsCSV = query({
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
    if (generation.type !== 'flashcards') {
      throw new Error('Generation is not flashcards');
    }

    const flashcardItems = await ctx.db
      .query('flashcardItems')
      .withIndex('by_generation', (q) =>
        q.eq('generationId', args.generationId),
      )
      .collect();

    const rows = [
      [
        'Question',
        'Answer',
        'Ease Factor',
        'Interval',
        'Repetitions',
        'Next Review',
      ],
      ...flashcardItems.map((item) => [
        item.question,
        item.answer,
        String(item.easeFactor),
        String(item.interval),
        String(item.repetitions),
        new Date(item.nextReview).toISOString(),
      ]),
    ];

    return rows
      .map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','),
      )
      .join('\n');
  },
});

export const exportQuizJSON = query({
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
    if (generation.type !== 'quiz') {
      throw new Error('Generation is not quiz');
    }

    const quizItems = await ctx.db
      .query('quizItems')
      .withIndex('by_generation', (q) =>
        q.eq('generationId', args.generationId),
      )
      .collect();

    const exportData = {
      name: generation.name,
      type: generation.type,
      createdAt: generation.createdAt,
      questions: quizItems.map((item) => ({
        question: item.question,
        options: item.options,
        correctIndex: item.correctIndex,
        explanation: item.explanation,
      })),
    };

    return JSON.stringify(exportData, null, 2);
  },
});

export const exportNotesMarkdown = query({
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
    if (generation.type !== 'notes') {
      throw new Error('Generation is not notes');
    }

    const notesContent = await ctx.db
      .query('notesContent')
      .withIndex('by_generation', (q) =>
        q.eq('generationId', args.generationId),
      )
      .first();

    if (!notesContent) {
      throw new Error('Notes content not found');
    }

    let markdown = `# ${generation.name}\n\n`;
    markdown += notesContent.content;
    markdown += '\n\n## Key Points\n\n';
    for (const point of notesContent.keyPoints) {
      markdown += `- ${point}\n`;
    }

    return markdown;
  },
});

export const exportSummaryMarkdown = query({
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
    if (generation.type !== 'summary') {
      throw new Error('Generation is not summary');
    }

    const summaryContent = await ctx.db
      .query('summaryContent')
      .withIndex('by_generation', (q) =>
        q.eq('generationId', args.generationId),
      )
      .first();

    if (!summaryContent) {
      throw new Error('Summary content not found');
    }

    let markdown = `# ${generation.name}\n\n`;

    for (const section of summaryContent.sections) {
      markdown += `## ${section.title}\n\n`;
      markdown += `${section.content}\n\n`;
    }

    return markdown;
  },
});

export const exportFolderGenerations = query({
  args: {
    folderId: v.id('folders'),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const folder = await ctx.db.get(args.folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }
    if (folder.userId !== userId) {
      throw new Error('Folder does not belong to user');
    }

    const generations = await ctx.db
      .query('generations')
      .withIndex('by_folder', (q) => q.eq('folderId', args.folderId))
      .collect();

    const exportData: Record<string, unknown> = {
      folder: {
        name: folder.name,
        exportedAt: Date.now(),
      },
      generations: [],
    };

    for (const generation of generations) {
      const genData: Record<string, unknown> = {
        id: generation._id,
        name: generation.name,
        type: generation.type,
        createdAt: generation.createdAt,
      };

      if (generation.type === 'flashcards') {
        const items = await ctx.db
          .query('flashcardItems')
          .withIndex('by_generation', (q) =>
            q.eq('generationId', generation._id),
          )
          .collect();
        genData.flashcards = items.map((item) => ({
          question: item.question,
          answer: item.answer,
          easeFactor: item.easeFactor,
          interval: item.interval,
          repetitions: item.repetitions,
          nextReview: item.nextReview,
        }));
      } else if (generation.type === 'quiz') {
        const items = await ctx.db
          .query('quizItems')
          .withIndex('by_generation', (q) =>
            q.eq('generationId', generation._id),
          )
          .collect();
        genData.questions = items.map((item) => ({
          question: item.question,
          options: item.options,
          correctIndex: item.correctIndex,
          explanation: item.explanation,
        }));
      } else if (generation.type === 'notes') {
        const content = await ctx.db
          .query('notesContent')
          .withIndex('by_generation', (q) =>
            q.eq('generationId', generation._id),
          )
          .first();
        if (content) {
          genData.content = content.content;
          genData.keyPoints = content.keyPoints;
        }
      } else if (generation.type === 'summary') {
        const content = await ctx.db
          .query('summaryContent')
          .withIndex('by_generation', (q) =>
            q.eq('generationId', generation._id),
          )
          .first();
        if (content) {
          genData.content = content.content;
          genData.sections = content.sections;
        }
      }

      (exportData.generations as Record<string, unknown>[]).push(genData);
    }

    return JSON.stringify(exportData, null, 2);
  },
});
