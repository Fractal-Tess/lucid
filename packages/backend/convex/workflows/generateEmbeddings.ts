import { v } from "convex/values";
import { action, mutation } from "../_generated/server";
import { api } from "../_generated/api";

const DOCLING_URL = process.env.DOCLING_URL || "http://localhost:8000";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Generate embeddings using OpenAI's text-embedding-3-small model
 */
async function generateEmbedding(text: string): Promise<number[]> {
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
 * Mutation to create a document chunk
 */
export const createChunk = mutation({
  args: {
    documentId: v.id("documents"),
    userId: v.id("users"),
    content: v.string(),
    embedding: v.array(v.number()),
    chunkIndex: v.number(),
    metadata: v.object({
      sectionTitle: v.optional(v.string()),
      pageNumber: v.optional(v.number()),
      charStart: v.optional(v.number()),
      charEnd: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("documentChunks", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

/**
 * Mutation to delete all chunks for a document
 */
export const deleteChunksForDocument = mutation({
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
 * Action to process a document: chunk it and generate embeddings
 */
export const processDocumentEmbeddings = action({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const getDoc = api.workflows.processDocument.getDocumentForProcessing;
    const createChunkMutation = api.workflows.generateEmbeddings.createChunk;
    const deleteChunksMutation = api.workflows.generateEmbeddings.deleteChunksForDocument;

    try {
      // Get the document
      const document = await ctx.runQuery(getDoc, {
        documentId: args.documentId,
      });

      if (!document) {
        throw new Error("Document not found");
      }

      if (!document.extractedText) {
        throw new Error("Document has no extracted text");
      }

      // Delete existing chunks for this document (in case of re-processing)
      await ctx.runMutation(deleteChunksMutation, {
        documentId: args.documentId,
      });

      // Get file URL and fetch the file
      const fileUrl = await ctx.storage.getUrl(document.storageId);
      if (!fileUrl) {
        throw new Error("Could not get file URL");
      }

      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file: ${fileResponse.statusText}`);
      }

      const fileBlob = await fileResponse.blob();
      const formData = new FormData();
      formData.append("file", fileBlob, document.name);

      // Call Docling chunking endpoint
      const chunkResponse = await fetch(`${DOCLING_URL}/chunk`, {
        method: "POST",
        body: formData,
      });

      if (!chunkResponse.ok) {
        const errorText = await chunkResponse.text();
        throw new Error(`Docling chunking failed: ${errorText}`);
      }

      const chunkResult = (await chunkResponse.json()) as {
        chunks: Array<{
          content: string;
          chunk_index: number;
          section_title: string | null;
          page_number: number | null;
          char_start: number;
          char_end: number;
        }>;
        total_chunks: number;
        total_chars: number;
      };

      // Generate embeddings and store chunks
      const chunksCreated: string[] = [];

      for (const chunk of chunkResult.chunks) {
        // Generate embedding for this chunk
        const embedding = await generateEmbedding(chunk.content);

        // Store chunk with embedding
        const chunkId = await ctx.runMutation(createChunkMutation, {
          documentId: args.documentId,
          userId: document.userId,
          content: chunk.content,
          embedding,
          chunkIndex: chunk.chunk_index,
          metadata: {
            sectionTitle: chunk.section_title ?? undefined,
            pageNumber: chunk.page_number ?? undefined,
            charStart: chunk.char_start,
            charEnd: chunk.char_end,
          },
        });

        chunksCreated.push(chunkId);
      }

      return {
        success: true,
        documentId: args.documentId,
        chunksCreated: chunksCreated.length,
        totalChars: chunkResult.total_chars,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      return {
        success: false,
        error: errorMessage,
        documentId: args.documentId,
      };
    }
  },
});
