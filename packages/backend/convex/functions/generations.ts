import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Generation type values for validation
 */
const generationType = v.union(
  v.literal("flashcards"),
  v.literal("quiz"),
  v.literal("notes"),
  v.literal("summary"),
  v.literal("study_guide"),
  v.literal("concept_map"),
);

/**
 * Generation status values for validation
 */
const generationStatus = v.union(v.literal("generating"), v.literal("ready"), v.literal("failed"));

import { authComponent } from "../auth";

/**
 * Get the current user's ID from our users table
 */
async function getCurrentUserId(ctx: any) {
  let authUser;
  try {
    authUser = await authComponent.getAuthUser(ctx);
  } catch {
    // User is not authenticated
    return null;
  }
  if (!authUser) {
    return null;
  }

  // Look up our user by the Better Auth ID
  const user = await ctx.db
    .query("users")
    .withIndex("by_better_auth_id", (q: any) => q.eq("betterAuthId", authUser._id))
    .first();

  return user?._id ?? null;
}

/**
 * List all generations for the current user
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return [];
    }
    return await ctx.db
      .query("generations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

/**
 * List generations by subject
 */
export const listBySubject = query({
  args: {
    subjectId: v.id("subjects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("generations")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId))
      .collect();
  },
});

/**
 * List generations by type for a user
 */
export const listByType = query({
  args: {
    userId: v.id("users"),
    type: generationType,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("generations")
      .withIndex("by_type", (q) => q.eq("userId", args.userId).eq("type", args.type))
      .collect();
  },
});

/**
 * Get a single generation by ID
 */
export const get = query({
  args: {
    id: v.id("generations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Create a new generation
 */
export const create = mutation({
  args: {
    userId: v.id("users"),
    subjectId: v.id("subjects"),
    sourceDocumentIds: v.array(v.id("documents")),
    name: v.string(),
    type: generationType,
  },
  handler: async (ctx, args) => {
    // Validate that all source documents exist and belong to user
    for (const docId of args.sourceDocumentIds) {
      const doc = await ctx.db.get(docId);
      if (!doc) {
        throw new Error(`Document not found: ${docId}`);
      }
      if (doc.userId !== args.userId) {
        throw new Error("Document does not belong to user");
      }
      if (doc.status !== "ready") {
        throw new Error(`Document ${doc.name} is not ready for processing`);
      }
    }

    const now = Date.now();
    const id = await ctx.db.insert("generations", {
      userId: args.userId,
      subjectId: args.subjectId,
      sourceDocumentIds: args.sourceDocumentIds,
      name: args.name,
      type: args.type,
      status: "generating",
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

/**
 * Update generation status
 */
export const updateStatus = mutation({
  args: {
    id: v.id("generations"),
    status: generationStatus,
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Generation not found");
    }

    const updates: {
      status: "generating" | "ready" | "failed";
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

/**
 * Update generation name
 */
export const update = mutation({
  args: {
    id: v.id("generations"),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Generation not found");
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

/**
 * Remove a generation and its associated content
 */
export const remove = mutation({
  args: {
    id: v.id("generations"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Generation not found");
    }

    // Delete associated content based on type
    if (existing.type === "flashcards") {
      const flashcardItems = await ctx.db
        .query("flashcardItems")
        .withIndex("by_generation", (q) => q.eq("generationId", args.id))
        .collect();
      for (const item of flashcardItems) {
        await ctx.db.delete(item._id);
      }
    } else if (existing.type === "quiz") {
      const quizItems = await ctx.db
        .query("quizItems")
        .withIndex("by_generation", (q) => q.eq("generationId", args.id))
        .collect();
      for (const item of quizItems) {
        await ctx.db.delete(item._id);
      }
    } else if (existing.type === "notes") {
      const notesContent = await ctx.db
        .query("notesContent")
        .withIndex("by_generation", (q) => q.eq("generationId", args.id))
        .collect();
      for (const item of notesContent) {
        await ctx.db.delete(item._id);
      }
    } else if (existing.type === "summary") {
      const summaryContent = await ctx.db
        .query("summaryContent")
        .withIndex("by_generation", (q) => q.eq("generationId", args.id))
        .collect();
      for (const item of summaryContent) {
        await ctx.db.delete(item._id);
      }
    } else if (existing.type === "study_guide") {
      const studyGuideContent = await ctx.db
        .query("studyGuideContent")
        .withIndex("by_generation", (q) => q.eq("generationId", args.id))
        .collect();
      for (const item of studyGuideContent) {
        await ctx.db.delete(item._id);
      }
    } else if (existing.type === "concept_map") {
      const conceptMapContent = await ctx.db
        .query("conceptMapContent")
        .withIndex("by_generation", (q) => q.eq("generationId", args.id))
        .collect();
      for (const item of conceptMapContent) {
        await ctx.db.delete(item._id);
      }
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});
