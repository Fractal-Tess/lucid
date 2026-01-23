import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { z } from "zod";
import type { Id } from "../_generated/dataModel";

/**
 * Document type for generation
 */
interface DocumentForGeneration {
  _id: Id<"documents">;
  name: string;
  extractedText?: string;
}

/**
 * OpenRouter API Configuration
 */
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "deepseek/deepseek-chat";

/**
 * System prompt for summary generation
 */
const SUMMARY_SYSTEM_PROMPT = `You are an expert summarizer and educator.

Your task is to create a comprehensive, structured summary from the provided text. The summary should help students understand the core concepts and details of the material.

Guidelines for creating summaries:
1. Start with a high-level overview ("content" field) that captures the main idea of the entire document.
2. Break down the material into logical sections ("sections" array).
3. Each section should have a clear title and detailed content.
4. Use clear, concise language.
5. Highlight key terms and definitions.
6. Maintain the logical flow of the original document.

You must respond with a JSON object. The object must have:
- "content": A general summary of the entire document (string)
- "sections": An array of objects, where each object has:
  - "title": The title of the section (string)
  - "content": The content of the section (string)

Example output format:
{
  "content": "This document covers the fundamental principles of...",
  "sections": [
    { "title": "Introduction", "content": "The introduction defines..." },
    { "title": "Key Concepts", "content": "Several key concepts are discussed..." }
  ]
}

IMPORTANT: Return ONLY the JSON object, no markdown code blocks or additional text.`;

/**
 * Schema for validating AI response
 */
const summaryResponseSchema = z.object({
  content: z.string().min(1),
  sections: z.array(
    z.object({
      title: z.string().min(1),
      content: z.string().min(1),
    }),
  ),
});

/**
 * Get document data for generation (internal)
 */
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

/**
 * Update generation status (internal)
 */
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

/**
 * Create summary content (internal)
 */
export const createSummaryContent = internalMutation({
  args: {
    generationId: v.id("generations"),
    userId: v.id("users"),
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
    const id = await ctx.db.insert("summaryContent", {
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
 * Call OpenRouter API to generate summary
 */
async function callOpenRouter(
  apiKey: string,
  documentText: string,
  options?: { maxTokens?: number; temperature?: number },
): Promise<{ content: string; sections: Array<{ title: string; content: string }> }> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: SUMMARY_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Create a summary from the following document content:\n\n${documentText}`,
        },
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

  const validated = summaryResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(`Invalid summary format: ${validated.error.message}`);
  }

  return validated.data;
}

/**
 * Generate summary from documents
 */
export const generateSummary = action({
  args: {
    generationId: v.id("generations"),
    userId: v.id("users"),
    documentIds: v.array(v.id("documents")),
  },
  handler: async (ctx, args) => {
    const updateStatus = internal.workflows.generateSummary.updateGenerationStatus;
    const getDocs = internal.workflows.generateSummary.getDocumentsForGeneration;
    const createContent = internal.workflows.generateSummary.createSummaryContent;

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

      const summary = await callOpenRouter(apiKey, combinedText);

      await ctx.runMutation(createContent, {
        generationId: args.generationId,
        userId: args.userId,
        content: summary.content,
        sections: summary.sections,
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

/**
 * Get generation for retry (internal)
 */
export const getGenerationForRetry = internalQuery({
  args: {
    generationId: v.id("generations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.generationId);
  },
});

/**
 * Retry failed summary generation
 */
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
    const generation = await ctx.runQuery(
      internal.workflows.generateSummary.getGenerationForRetry,
      { generationId: args.generationId },
    );

    if (!generation) {
      throw new Error("Generation not found");
    }

    if (generation.status !== "failed") {
      throw new Error("Can only retry failed generations");
    }

    if (generation.type !== "summary") {
      throw new Error("This action only handles summary generations");
    }

    await ctx.runMutation(internal.workflows.generateSummary.updateGenerationStatus, {
      generationId: args.generationId,
      status: "generating" as const,
    });

    return await ctx.runAction(api.workflows.generateSummary.generateSummary, {
      generationId: args.generationId,
      userId: generation.userId,
      documentIds: generation.sourceDocumentIds,
    });
  },
});
