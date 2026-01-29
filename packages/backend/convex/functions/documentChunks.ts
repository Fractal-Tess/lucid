import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { api } from "../_generated/api";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Generate embedding for search query
 */
async function generateQueryEmbedding(text: string): Promise<number[]> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input: text,
      model: "text-embedding-3-small",
      dimensions: 1536,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = (await response.json()) as {
    data: Array<{ embedding: number[] }>;
  };

  return data.data[0].embedding;
}

/**
 * List all chunks for a document
 */
export const listByDocument = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documentChunks")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .order("asc")
      .collect();
  },
});

/**
 * Get a specific chunk by ID
 */
export const get = query({
  args: {
    id: v.id("documentChunks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Delete all chunks for a document
 */
export const deleteByDocument = mutation({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const chunks = await ctx.db
      .query("documentChunks")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    for (const chunk of chunks) {
      await ctx.db.delete(chunk._id);
    }

    return { deleted: chunks.length };
  },
});

/**
 * Search for similar chunks across all user's documents
 * Uses Convex vector search
 */
export const searchSimilar = query({
  args: {
    userId: v.id("users"),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Generate embedding for the query
    const queryEmbedding = await generateQueryEmbedding(args.query);

    // Search for similar chunks using vector index
    // Filter by userId to only search user's own documents
    const results = await ctx.db
      .query("documentChunks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        // Use vector similarity search
        q.eq(q.field("embedding"), queryEmbedding as unknown as number[]),
      )
      .take(limit);

    // Calculate similarity scores and return with metadata
    return results.map((chunk) => ({
      chunkId: chunk._id,
      documentId: chunk.documentId,
      content: chunk.content,
      chunkIndex: chunk.chunkIndex,
      metadata: chunk.metadata,
      createdAt: chunk.createdAt,
    }));
  },
});

/**
 * Search for similar chunks within a specific document
 */
export const searchSimilarInDocument = query({
  args: {
    documentId: v.id("documents"),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;

    // Generate embedding for the query
    const queryEmbedding = await generateQueryEmbedding(args.query);

    // Search for similar chunks within the document
    const results = await ctx.db
      .query("documentChunks")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .filter((q) => q.eq(q.field("embedding"), queryEmbedding as unknown as number[]))
      .take(limit);

    return results.map((chunk) => ({
      chunkId: chunk._id,
      content: chunk.content,
      chunkIndex: chunk.chunkIndex,
      metadata: chunk.metadata,
      createdAt: chunk.createdAt,
    }));
  },
});

/**
 * Get chunks by IDs (for retrieving context after search)
 */
export const getByIds = query({
  args: {
    chunkIds: v.array(v.id("documentChunks")),
  },
  handler: async (ctx, args) => {
    const chunks = [];
    for (const id of args.chunkIds) {
      const chunk = await ctx.db.get(id);
      if (chunk) {
        chunks.push(chunk);
      }
    }
    return chunks;
  },
});

/**
 * Get total chunk count for a document
 */
export const getChunkCount = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const chunks = await ctx.db
      .query("documentChunks")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    return chunks.length;
  },
});
