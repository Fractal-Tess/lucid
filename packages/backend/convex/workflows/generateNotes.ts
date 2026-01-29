import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "../_generated/server";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { notesResponseSchema, createNotesPrompt } from "@lucid/ai/prompts/notes";

interface DocumentForGeneration {
  _id: Id<"documents">;
  name: string;
  extractedText?: string;
}

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "deepseek/deepseek-chat";

export const getDocumentsForGeneration = internalQuery({
  args: {
    documentIds: v.array(v.id("documents")),
  },
  handler: async (ctx, args): Promise<DocumentForGeneration[]> => {
    const documents: DocumentForGeneration[] = [];
    for (const docId of args.documentIds) {
      const doc = await ctx.db.get(docId);
      if (doc) {
        documents.push({
          _id: doc._id,
          name: doc.name,
          extractedText: doc.extractedText,
        });
      }
    }
    return documents;
  },
});

export const updateGenerationStatus = internalMutation({
  args: {
    generationId: v.id("generations"),
    status: v.union(v.literal("generating"), v.literal("ready"), v.literal("failed")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.generationId, {
      status: args.status,
      error: args.error,
      updatedAt: Date.now(),
    });
  },
});

export const createNotesContent = internalMutation({
  args: {
    generationId: v.id("generations"),
    userId: v.id("users"),
    content: v.string(),
    keyPoints: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("notesContent", {
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

async function callOpenRouter(
  apiKey: string,
  documentText: string,
  options?: { maxTokens?: number; temperature?: number },
): Promise<{ content: string; keyPoints: string[] }> {
  const prompts = createNotesPrompt(documentText);

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: prompts.system },
        { role: "user", content: prompts.user },
      ],
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.5,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${errorText}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = data.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content in OpenRouter response");
  }

  let parsed: unknown;
  try {
    let jsonString = content.trim();
    if (jsonString.startsWith("```json")) {
      jsonString = jsonString.slice(7);
    } else if (jsonString.startsWith("```")) {
      jsonString = jsonString.slice(3);
    }
    if (jsonString.endsWith("```")) {
      jsonString = jsonString.slice(0, -3);
    }
    jsonString = jsonString.trim();

    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error(`Failed to parse AI response as JSON: ${content.slice(0, 200)}...`);
  }

  const validated = notesResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(`Invalid notes format: ${validated.error.message}`);
  }

  return validated.data;
}

export const generateNotes = action({
  args: {
    generationId: v.id("generations"),
    userId: v.id("users"),
    documentIds: v.array(v.id("documents")),
  },
  handler: async (ctx, args) => {
    const updateStatus = internal.workflows.generateNotes.updateGenerationStatus;
    const getDocs = internal.workflows.generateNotes.getDocumentsForGeneration;
    const createContent = internal.workflows.generateNotes.createNotesContent;

    try {
      const documents = await ctx.runQuery(getDocs, {
        documentIds: args.documentIds,
      });

      if (documents.length === 0) {
        throw new Error("No documents found");
      }

      const combinedText = documents
        .map((doc) => {
          if (!doc.extractedText) {
            throw new Error(`Document "${doc.name}" has no extracted text`);
          }
          return `=== ${doc.name} ===\n${doc.extractedText}`;
        })
        .join("\n\n");

      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY is not configured");
      }

      const notes = await callOpenRouter(apiKey, combinedText);

      await ctx.runMutation(createContent, {
        generationId: args.generationId,
        userId: args.userId,
        content: notes.content,
        keyPoints: notes.keyPoints,
      });

      await ctx.runMutation(updateStatus, {
        generationId: args.generationId,
        status: "ready" as const,
      });

      return {
        success: true,
        generationId: args.generationId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      await ctx.runMutation(updateStatus, {
        generationId: args.generationId,
        status: "failed" as const,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

export const getGenerationForRetry = internalQuery({
  args: {
    generationId: v.id("generations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.generationId);
  },
});

export const retryGeneration = action({
  args: {
    generationId: v.id("generations"),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    success: boolean;
    generationId?: string;
    error?: string;
  }> => {
    const generation = await ctx.runQuery(internal.workflows.generateNotes.getGenerationForRetry, {
      generationId: args.generationId,
    });

    if (!generation) {
      throw new Error("Generation not found");
    }

    if (generation.status !== "failed") {
      throw new Error("Can only retry failed generations");
    }

    if (generation.type !== "notes") {
      throw new Error("This action only handles notes generations");
    }

    await ctx.runMutation(internal.workflows.generateNotes.updateGenerationStatus, {
      generationId: args.generationId,
      status: "generating" as const,
    });

    return await ctx.runAction(api.workflows.generateNotes.generateNotes, {
      generationId: args.generationId,
      userId: generation.userId,
      documentIds: generation.sourceDocumentIds,
    });
  },
});
