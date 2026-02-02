import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    betterAuthId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    plan: v.union(v.literal('free'), v.literal('paid')),
    createdAt: v.number(),
  }).index('by_better_auth_id', ['betterAuthId']),

  // ============================================
  // FILE SYSTEM HIERARCHY
  // Folders (with nesting) → Documents
  // ============================================

  // Folders are the primary organizational unit
  // Can be nested (parentId) for infinite depth
  folders: defineTable({
    userId: v.id('users'),
    parentId: v.optional(v.id('folders')), // For nested folders
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()), // Emoji or icon name
    color: v.optional(v.string()), // For UI theming
    order: v.number(), // Display order within parent
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_parent', ['parentId']),

  // Documents belong to a folder (optional - can be at root)
  documents: defineTable({
    userId: v.id('users'),
    folderId: v.optional(v.id('folders')), // Optional: can be at root level
    name: v.string(),
    storageId: v.id('_storage'),
    mimeType: v.string(),
    size: v.number(),
    status: v.union(
      v.literal('pending'),
      v.literal('processing'),
      v.literal('ready'),
      v.literal('failed'),
    ),
    extractedText: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_folder', ['folderId']),

  // ============================================
  // GENERATIONS (AI-Generated Content)
  // Appear in file tree alongside documents
  // ============================================

  // Generations live in a folder
  generations: defineTable({
    userId: v.id('users'),
    folderId: v.id('folders'), // Which folder contains this generation
    sourceDocumentIds: v.array(v.id('documents')), // Which files were used

    name: v.string(),
    type: v.union(
      v.literal('flashcards'),
      v.literal('quiz'),
      v.literal('notes'),
      v.literal('summary'),
      v.literal('study_guide'),
      v.literal('concept_map'),
    ),

    status: v.union(
      v.literal('generating'),
      v.literal('ready'),
      v.literal('failed'),
    ),
    error: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_folder', ['folderId'])
    .index('by_type', ['userId', 'type'])
    .index('by_source_doc', ['sourceDocumentIds']), // Filter by source document

  // Flashcard items within a flashcard generation
  flashcardItems: defineTable({
    generationId: v.id('generations'),
    userId: v.id('users'),
    question: v.string(),
    answer: v.string(),
    order: v.number(),
    // SM-2 Algorithm fields
    easeFactor: v.number(), // Default 2.5
    interval: v.number(), // Days until next review
    repetitions: v.number(), // Successful reviews in a row
    nextReview: v.number(), // Timestamp
    createdAt: v.number(),
  })
    .index('by_generation', ['generationId'])
    .index('by_user_next_review', ['userId', 'nextReview']),

  // Quiz items within a quiz generation
  quizItems: defineTable({
    generationId: v.id('generations'),
    userId: v.id('users'),
    question: v.string(),
    options: v.array(v.string()),
    correctIndex: v.number(),
    explanation: v.optional(v.string()),
    order: v.number(),
    createdAt: v.number(),
  }).index('by_generation', ['generationId']),

  // Notes content (single rich text document)
  notesContent: defineTable({
    generationId: v.id('generations'),
    userId: v.id('users'),
    content: v.string(), // Markdown
    keyPoints: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_generation', ['generationId']),

  // Summary content
  summaryContent: defineTable({
    generationId: v.id('generations'),
    userId: v.id('users'),
    content: v.string(),
    sections: v.array(
      v.object({
        title: v.string(),
        content: v.string(),
      }),
    ),
    createdAt: v.number(),
  }).index('by_generation', ['generationId']),

  studySessions: defineTable({
    userId: v.id('users'),
    documentId: v.optional(v.id('documents')),
    mode: v.union(
      v.literal('flashcards'),
      v.literal('quiz'),
      v.literal('review'),
    ),
    cardsStudied: v.number(),
    correctAnswers: v.number(),
    duration: v.number(), // Seconds
    completedAt: v.number(),
  }).index('by_user', ['userId']),

  sharedDecks: defineTable({
    generationId: v.id('generations'),
    ownerId: v.id('users'),
    shareCode: v.string(),
    isPublic: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_share_code', ['shareCode'])
    .index('by_owner', ['ownerId'])
    .index('by_generation', ['generationId']),

  // Phase 2: Chat with Document
  chatMessages: defineTable({
    documentId: v.id('documents'),
    userId: v.id('users'),
    role: v.union(v.literal('user'), v.literal('assistant')),
    content: v.string(),
    citations: v.optional(
      v.array(
        v.object({
          text: v.string(),
          section: v.optional(v.string()),
        }),
      ),
    ),
    createdAt: v.number(),
  }).index('by_document', ['documentId']),

  // Phase 2: Solve Mode
  solveQuestions: defineTable({
    userId: v.id('users'),
    question: v.string(),
    subject: v.optional(v.string()),
    solution: v.string(),
    steps: v.array(
      v.object({
        step: v.number(),
        explanation: v.string(),
      }),
    ),
    createdAt: v.number(),
  }).index('by_user', ['userId']),

  // Phase 2: Progress Dashboard
  dailyStats: defineTable({
    userId: v.id('users'),
    date: v.string(), // YYYY-MM-DD
    cardsStudied: v.number(),
    quizzesTaken: v.number(),
    correctAnswers: v.number(),
    studyTimeSeconds: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_date', ['userId', 'date']),

  streaks: defineTable({
    userId: v.id('users'),
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastStudyDate: v.string(),
  }).index('by_user', ['userId']),

  // Phase 3: Study Guide content
  studyGuideContent: defineTable({
    generationId: v.id('generations'),
    userId: v.id('users'),
    topics: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        description: v.string(),
        importance: v.union(
          v.literal('high'),
          v.literal('medium'),
          v.literal('low'),
        ),
        estimatedMinutes: v.number(),
        completed: v.boolean(),
        order: v.number(),
      }),
    ),
    preTestScore: v.optional(v.number()),
    postTestScore: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_generation', ['generationId']),

  // Phase 3: Audio Recordings
  recordings: defineTable({
    userId: v.id('users'),
    name: v.string(),
    storageId: v.id('_storage'),
    duration: v.number(), // Seconds
    status: v.union(
      v.literal('pending'),
      v.literal('transcribing'),
      v.literal('ready'),
      v.literal('failed'),
    ),
    transcript: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_user', ['userId']),

  // Phase 3: Generated Notes (from recordings or documents)
  notes: defineTable({
    userId: v.id('users'),
    sourceType: v.union(
      v.literal('recording'),
      v.literal('document'),
      v.literal('manual'),
    ),
    sourceId: v.optional(v.string()),
    title: v.string(),
    content: v.string(), // Markdown
    keyPoints: v.array(v.string()),
    actionItems: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_user', ['userId']),

  // Phase 3: Practice Problems
  practiceProblems: defineTable({
    documentId: v.optional(v.id('documents')),
    userId: v.id('users'),
    topic: v.string(),
    difficulty: v.union(
      v.literal('easy'),
      v.literal('medium'),
      v.literal('hard'),
    ),
    problem: v.string(),
    solution: v.string(),
    steps: v.array(
      v.object({
        step: v.number(),
        explanation: v.string(),
      }),
    ),
    userAnswer: v.optional(v.string()),
    isCorrect: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_topic', ['userId', 'topic']),

  // Phase 3: Concept Map content
  conceptMapContent: defineTable({
    generationId: v.id('generations'),
    userId: v.id('users'),
    nodes: v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        description: v.optional(v.string()),
        x: v.number(),
        y: v.number(),
        color: v.optional(v.string()),
      }),
    ),
    edges: v.array(
      v.object({
        id: v.string(),
        source: v.string(),
        target: v.string(),
        label: v.optional(v.string()),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_generation', ['generationId']),

  // Phase 3: Pomodoro Sessions
  pomodoroSessions: defineTable({
    userId: v.id('users'),
    documentId: v.optional(v.id('documents')),
    type: v.union(v.literal('work'), v.literal('break')),
    duration: v.number(), // Planned duration in seconds
    actualDuration: v.number(), // Actual duration
    completed: v.boolean(),
    createdAt: v.number(),
  }).index('by_user', ['userId']),

  // ============================================
  // VECTOR SEARCH - Document Chunks with Embeddings
  // ============================================

  documentChunks: defineTable({
    documentId: v.id('documents'),
    userId: v.id('users'),
    content: v.string(), // The text chunk
    embedding: v.array(v.number()), // Vector embedding (e.g., 1536 dimensions for OpenAI)
    chunkIndex: v.number(), // Position in document (0, 1, 2, ...)
    metadata: v.object({
      sectionTitle: v.optional(v.string()), // Section/chapter title if available
      pageNumber: v.optional(v.number()), // Page number if available
      charStart: v.optional(v.number()), // Character position start
      charEnd: v.optional(v.number()), // Character position end
    }),
    createdAt: v.number(),
  })
    .index('by_document', ['documentId'])
    .index('by_user', ['userId'])
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: 1536, // OpenAI text-embedding-3-small
      filterFields: ['documentId', 'userId'],
    }),
});
