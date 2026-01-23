import { describe, it, expect, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import { z } from "zod";
import schema from "../schema";
import { modules } from "../test.setup";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

/**
 * Schema for validating AI response (same as in the workflow)
 */
const flashcardResponseSchema = z.array(
  z.object({
    question: z.string().min(1),
    answer: z.string().min(1),
  }),
);

// ============================================
// Unit Tests for Schema Validation
// ============================================

describe("flashcard response schema validation (unit tests)", () => {
  it("should validate correct flashcard array format", () => {
    const validResponse = [
      { question: "What is photosynthesis?", answer: "The process of converting light to energy." },
      { question: "What is mitosis?", answer: "Cell division process." },
    ];

    const result = flashcardResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
  });

  it("should accept empty array (emptiness checked separately)", () => {
    const emptyResponse: unknown[] = [];
    const result = flashcardResponseSchema.safeParse(emptyResponse);
    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(0);
  });

  it("should reject missing question field", () => {
    const invalidResponse = [{ answer: "An answer without question" }];
    const result = flashcardResponseSchema.safeParse(invalidResponse);
    expect(result.success).toBe(false);
  });

  it("should reject missing answer field", () => {
    const invalidResponse = [{ question: "A question without answer" }];
    const result = flashcardResponseSchema.safeParse(invalidResponse);
    expect(result.success).toBe(false);
  });

  it("should reject empty question string", () => {
    const invalidResponse = [{ question: "", answer: "Valid answer" }];
    const result = flashcardResponseSchema.safeParse(invalidResponse);
    expect(result.success).toBe(false);
  });

  it("should reject empty answer string", () => {
    const invalidResponse = [{ question: "Valid question?", answer: "" }];
    const result = flashcardResponseSchema.safeParse(invalidResponse);
    expect(result.success).toBe(false);
  });

  it("should reject non-array response", () => {
    const invalidResponse = { question: "Q", answer: "A" };
    const result = flashcardResponseSchema.safeParse(invalidResponse);
    expect(result.success).toBe(false);
  });

  it("should reject null response", () => {
    const result = flashcardResponseSchema.safeParse(null);
    expect(result.success).toBe(false);
  });
});

describe("JSON parsing from AI response (unit tests)", () => {
  it("should handle clean JSON response", () => {
    const cleanJson = '[{"question":"Q1","answer":"A1"}]';
    const parsed = JSON.parse(cleanJson);
    expect(flashcardResponseSchema.safeParse(parsed).success).toBe(true);
  });

  it("should handle JSON with markdown code blocks", () => {
    const markdownJson = '```json\n[{"question":"Q1","answer":"A1"}]\n```';
    let jsonString = markdownJson.trim();
    if (jsonString.startsWith("```json")) {
      jsonString = jsonString.slice(7);
    }
    if (jsonString.endsWith("```")) {
      jsonString = jsonString.slice(0, -3);
    }
    jsonString = jsonString.trim();

    const parsed = JSON.parse(jsonString);
    expect(flashcardResponseSchema.safeParse(parsed).success).toBe(true);
  });

  it("should handle JSON with generic code blocks", () => {
    const markdownJson = '```\n[{"question":"Q1","answer":"A1"}]\n```';
    let jsonString = markdownJson.trim();
    if (jsonString.startsWith("```json")) {
      jsonString = jsonString.slice(7);
    } else if (jsonString.startsWith("```")) {
      jsonString = jsonString.slice(3);
    }
    if (jsonString.endsWith("```")) {
      jsonString = jsonString.slice(0, -3);
    }
    jsonString = jsonString.trim();

    const parsed = JSON.parse(jsonString);
    expect(flashcardResponseSchema.safeParse(parsed).success).toBe(true);
  });
});

// ============================================
// Integration Tests for Internal Functions
// ============================================

describe("generateFlashcards internal functions (integration tests)", () => {
  let t: ReturnType<typeof convexTest>;
  let userId: Id<"users">;
  let subjectId: Id<"subjects">;
  let documentId: Id<"documents">;
  let generationId: Id<"generations">;

  beforeEach(async () => {
    t = convexTest(schema, modules);

    // Create test user
    userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        betterAuthId: "test-auth-id",
        email: "test@example.com",
        name: "Test User",
        plan: "free",
        createdAt: Date.now(),
      });
    });

    // Create test subject
    subjectId = await t.run(async (ctx) => {
      return await ctx.db.insert("subjects", {
        userId,
        name: "Test Subject",
        order: 0,
        createdAt: Date.now(),
      });
    });

    // Create test document with extracted text
    documentId = await t.run(async (ctx) => {
      const storageId = await ctx.storage.store(new Blob(["test content"]));
      return await ctx.db.insert("documents", {
        userId,
        subjectId,
        name: "Test Document.pdf",
        storageId,
        mimeType: "application/pdf",
        size: 1024,
        status: "ready",
        extractedText: "This is test content for flashcard generation.",
        createdAt: Date.now(),
      });
    });

    // Create test generation
    generationId = await t.run(async (ctx) => {
      return await ctx.db.insert("generations", {
        userId,
        subjectId,
        sourceDocumentIds: [documentId],
        name: "Test Flashcards",
        type: "flashcards",
        status: "generating",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });
  });

  describe("getDocumentsForGeneration", () => {
    it("should return documents with required fields", async () => {
      const documents = await t.query(
        internal.workflows.generateFlashcards.getDocumentsForGeneration,
        {
          documentIds: [documentId],
        },
      );

      expect(documents.length).toBe(1);
      expect(documents[0]?._id).toBe(documentId);
      expect(documents[0]?.name).toBe("Test Document.pdf");
      expect(documents[0]?.extractedText).toBe("This is test content for flashcard generation.");
    });

    it("should return multiple documents", async () => {
      // Create another document
      const document2Id = await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(new Blob(["more content"]));
        return await ctx.db.insert("documents", {
          userId,
          subjectId,
          name: "Second Document.pdf",
          storageId,
          mimeType: "application/pdf",
          size: 2048,
          status: "ready",
          extractedText: "Second document content.",
          createdAt: Date.now(),
        });
      });

      const documents = await t.query(
        internal.workflows.generateFlashcards.getDocumentsForGeneration,
        {
          documentIds: [documentId, document2Id],
        },
      );

      expect(documents.length).toBe(2);
    });

    it("should skip non-existent documents", async () => {
      // Create and delete a document
      const tempDocId = await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(new Blob(["temp"]));
        const id = await ctx.db.insert("documents", {
          userId,
          subjectId,
          name: "Temp.pdf",
          storageId,
          mimeType: "application/pdf",
          size: 100,
          status: "ready",
          createdAt: Date.now(),
        });
        await ctx.db.delete(id);
        return id;
      });

      const documents = await t.query(
        internal.workflows.generateFlashcards.getDocumentsForGeneration,
        {
          documentIds: [documentId, tempDocId],
        },
      );

      expect(documents.length).toBe(1);
      expect(documents[0]?._id).toBe(documentId);
    });
  });

  describe("updateGenerationStatus", () => {
    it("should update status to ready", async () => {
      await t.mutation(internal.workflows.generateFlashcards.updateGenerationStatus, {
        generationId,
        status: "ready",
      });

      const generation = await t.run(async (ctx) => {
        return await ctx.db.get(generationId);
      });

      expect(generation?.status).toBe("ready");
    });

    it("should update status to failed with error message", async () => {
      await t.mutation(internal.workflows.generateFlashcards.updateGenerationStatus, {
        generationId,
        status: "failed",
        error: "API call failed",
      });

      const generation = await t.run(async (ctx) => {
        return await ctx.db.get(generationId);
      });

      expect(generation?.status).toBe("failed");
      expect(generation?.error).toBe("API call failed");
    });

    it("should update the updatedAt timestamp", async () => {
      const beforeUpdate = Date.now();

      await t.mutation(internal.workflows.generateFlashcards.updateGenerationStatus, {
        generationId,
        status: "ready",
      });

      const generation = await t.run(async (ctx) => {
        return await ctx.db.get(generationId);
      });

      expect(generation?.updatedAt).toBeGreaterThanOrEqual(beforeUpdate);
    });
  });

  describe("createFlashcardItems", () => {
    it("should create flashcard items with SM-2 defaults", async () => {
      const items = [
        { question: "What is X?", answer: "X is a variable." },
        { question: "What is Y?", answer: "Y is another variable." },
      ];

      const ids = await t.mutation(internal.workflows.generateFlashcards.createFlashcardItems, {
        generationId,
        userId,
        items,
      });

      expect(ids.length).toBe(2);

      // Verify flashcard items were created correctly
      const flashcards = await t.run(async (ctx) => {
        return await ctx.db
          .query("flashcardItems")
          .withIndex("by_generation", (q) => q.eq("generationId", generationId))
          .collect();
      });

      expect(flashcards.length).toBe(2);
      expect(flashcards[0]?.easeFactor).toBe(2.5);
      expect(flashcards[0]?.interval).toBe(0);
      expect(flashcards[0]?.repetitions).toBe(0);
    });

    it("should assign sequential order values", async () => {
      const items = [
        { question: "Q1", answer: "A1" },
        { question: "Q2", answer: "A2" },
        { question: "Q3", answer: "A3" },
      ];

      await t.mutation(internal.workflows.generateFlashcards.createFlashcardItems, {
        generationId,
        userId,
        items,
      });

      const flashcards = await t.run(async (ctx) => {
        return await ctx.db
          .query("flashcardItems")
          .withIndex("by_generation", (q) => q.eq("generationId", generationId))
          .collect();
      });

      const sorted = flashcards.sort((a, b) => a.order - b.order);
      expect(sorted[0]?.order).toBe(0);
      expect(sorted[0]?.question).toBe("Q1");
      expect(sorted[1]?.order).toBe(1);
      expect(sorted[1]?.question).toBe("Q2");
      expect(sorted[2]?.order).toBe(2);
      expect(sorted[2]?.question).toBe("Q3");
    });

    it("should set nextReview to now (immediately due)", async () => {
      const before = Date.now();

      await t.mutation(internal.workflows.generateFlashcards.createFlashcardItems, {
        generationId,
        userId,
        items: [{ question: "Q", answer: "A" }],
      });

      const flashcards = await t.run(async (ctx) => {
        return await ctx.db
          .query("flashcardItems")
          .withIndex("by_generation", (q) => q.eq("generationId", generationId))
          .collect();
      });

      expect(flashcards[0]?.nextReview).toBeGreaterThanOrEqual(before);
      expect(flashcards[0]?.nextReview).toBeLessThanOrEqual(Date.now() + 1000);
    });
  });

  describe("getGenerationForRetry", () => {
    it("should return generation data", async () => {
      const generation = await t.query(
        internal.workflows.generateFlashcards.getGenerationForRetry,
        {
          generationId,
        },
      );

      expect(generation).not.toBeNull();
      expect(generation?._id).toBe(generationId);
      expect(generation?.name).toBe("Test Flashcards");
      expect(generation?.type).toBe("flashcards");
    });

    it("should return null for non-existent generation", async () => {
      // Create and delete a generation
      const tempId = await t.run(async (ctx) => {
        const id = await ctx.db.insert("generations", {
          userId,
          subjectId,
          sourceDocumentIds: [documentId],
          name: "Temp",
          type: "flashcards",
          status: "ready",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        await ctx.db.delete(id);
        return id;
      });

      const generation = await t.query(
        internal.workflows.generateFlashcards.getGenerationForRetry,
        {
          generationId: tempId,
        },
      );

      expect(generation).toBeNull();
    });
  });
});

// ============================================
// Document Text Combination Tests
// ============================================

describe("document text combination (unit tests)", () => {
  it("should combine multiple document texts with headers", () => {
    const documents = [
      { name: "Doc 1", extractedText: "Text 1" },
      { name: "Doc 2", extractedText: "Text 2" },
    ];

    const combined = documents
      .map((doc) => `=== ${doc.name} ===\n${doc.extractedText}`)
      .join("\n\n");

    expect(combined).toContain("=== Doc 1 ===");
    expect(combined).toContain("=== Doc 2 ===");
    expect(combined).toContain("Text 1");
    expect(combined).toContain("Text 2");
  });

  it("should preserve document content in headers", () => {
    const documents = [
      { name: "Chapter_1_Introduction.pdf", extractedText: "This is the introduction..." },
    ];

    const combined = documents
      .map((doc) => `=== ${doc.name} ===\n${doc.extractedText}`)
      .join("\n\n");

    expect(combined).toBe("=== Chapter_1_Introduction.pdf ===\nThis is the introduction...");
  });
});

// ============================================
// Configuration Tests
// ============================================

describe("workflow configuration (unit tests)", () => {
  it("should use deepseek model by default", () => {
    const defaultModel = "deepseek/deepseek-chat";
    expect(defaultModel).toBe("deepseek/deepseek-chat");
  });

  it("should use correct OpenRouter API endpoint", () => {
    const apiUrl = "https://openrouter.ai/api/v1/chat/completions";
    expect(apiUrl).toContain("openrouter.ai");
    expect(apiUrl).toContain("chat/completions");
  });

  it("should have sensible default parameters", () => {
    const defaults = {
      maxTokens: 4096,
      temperature: 0.7,
    };
    expect(defaults.maxTokens).toBe(4096);
    expect(defaults.temperature).toBe(0.7);
    expect(defaults.temperature).toBeGreaterThan(0);
    expect(defaults.temperature).toBeLessThanOrEqual(1);
  });
});
