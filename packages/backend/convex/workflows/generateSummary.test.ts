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
const summaryResponseSchema = z.object({
  content: z.string().min(1),
  sections: z.array(
    z.object({
      title: z.string().min(1),
      content: z.string().min(1),
    }),
  ),
});

// ============================================
// Unit Tests for Schema Validation
// ============================================

describe("summary response schema validation (unit tests)", () => {
  it("should validate correct summary object format", () => {
    const validResponse = {
      content: "Main summary content.",
      sections: [
        { title: "Intro", content: "Introduction content." },
        { title: "Conclusion", content: "Conclusion content." },
      ],
    };

    const result = summaryResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
  });

  it("should accept empty sections array (if content is present)", () => {
    const validResponse = {
      content: "Just a summary without sections.",
      sections: [],
    };
    const result = summaryResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
    expect(result.data?.sections.length).toBe(0);
  });

  it("should reject missing content field", () => {
    const invalidResponse = {
      sections: [{ title: "T", content: "C" }],
    };
    const result = summaryResponseSchema.safeParse(invalidResponse);
    expect(result.success).toBe(false);
  });

  it("should reject missing sections field", () => {
    const invalidResponse = {
      content: "Summary text",
    };
    const result = summaryResponseSchema.safeParse(invalidResponse);
    expect(result.success).toBe(false);
  });

  it("should reject empty content string", () => {
    const invalidResponse = {
      content: "",
      sections: [],
    };
    const result = summaryResponseSchema.safeParse(invalidResponse);
    expect(result.success).toBe(false);
  });

  it("should reject invalid section format", () => {
    const invalidResponse = {
      content: "Valid content",
      sections: [{ title: "Missing content" }],
    };
    const result = summaryResponseSchema.safeParse(invalidResponse);
    expect(result.success).toBe(false);
  });

  it("should reject non-object response", () => {
    const invalidResponse = "Just a string";
    const result = summaryResponseSchema.safeParse(invalidResponse);
    expect(result.success).toBe(false);
  });

  it("should reject null response", () => {
    const result = summaryResponseSchema.safeParse(null);
    expect(result.success).toBe(false);
  });
});

describe("JSON parsing from AI response (unit tests)", () => {
  it("should handle clean JSON response", () => {
    const cleanJson = '{"content":"Main","sections":[{"title":"T1","content":"C1"}]}';
    const parsed = JSON.parse(cleanJson);
    expect(summaryResponseSchema.safeParse(parsed).success).toBe(true);
  });

  it("should handle JSON with markdown code blocks", () => {
    const markdownJson =
      '```json\n{"content":"Main","sections":[{"title":"T1","content":"C1"}]}\n```';
    let jsonString = markdownJson.trim();
    if (jsonString.startsWith("```json")) {
      jsonString = jsonString.slice(7);
    }
    if (jsonString.endsWith("```")) {
      jsonString = jsonString.slice(0, -3);
    }
    jsonString = jsonString.trim();

    const parsed = JSON.parse(jsonString);
    expect(summaryResponseSchema.safeParse(parsed).success).toBe(true);
  });

  it("should handle JSON with generic code blocks", () => {
    const markdownJson = '```\n{"content":"Main","sections":[{"title":"T1","content":"C1"}]}\n```';
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
    expect(summaryResponseSchema.safeParse(parsed).success).toBe(true);
  });
});

// ============================================
// Integration Tests for Internal Functions
// ============================================

describe("generateSummary internal functions (integration tests)", () => {
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
        extractedText: "This is test content for summary generation.",
        createdAt: Date.now(),
      });
    });

    // Create test generation
    generationId = await t.run(async (ctx) => {
      return await ctx.db.insert("generations", {
        userId,
        subjectId,
        sourceDocumentIds: [documentId],
        name: "Test Summary",
        type: "summary",
        status: "generating",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });
  });

  describe("getDocumentsForGeneration", () => {
    it("should return documents with required fields", async () => {
      const documents = await t.query(
        internal.workflows.generateSummary.getDocumentsForGeneration,
        {
          documentIds: [documentId],
        },
      );

      expect(documents.length).toBe(1);
      expect(documents[0]?._id).toBe(documentId);
      expect(documents[0]?.name).toBe("Test Document.pdf");
      expect(documents[0]?.extractedText).toBe("This is test content for summary generation.");
    });
  });

  describe("updateGenerationStatus", () => {
    it("should update status to ready", async () => {
      await t.mutation(internal.workflows.generateSummary.updateGenerationStatus, {
        generationId,
        status: "ready",
      });

      const generation = await t.run(async (ctx) => {
        return await ctx.db.get(generationId);
      });

      expect(generation?.status).toBe("ready");
    });

    it("should update status to failed with error message", async () => {
      await t.mutation(internal.workflows.generateSummary.updateGenerationStatus, {
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
  });

  describe("createSummaryContent", () => {
    it("should create summary content record", async () => {
      const content = "Overall summary";
      const sections = [
        { title: "Sec 1", content: "Content 1" },
        { title: "Sec 2", content: "Content 2" },
      ];

      const id = await t.mutation(internal.workflows.generateSummary.createSummaryContent, {
        generationId,
        userId,
        content,
        sections,
      });

      expect(id).toBeDefined();

      // Verify summary content was created correctly
      const summaryContent = await t.run(async (ctx) => {
        return await ctx.db
          .query("summaryContent")
          .withIndex("by_generation", (q) => q.eq("generationId", generationId))
          .collect();
      });

      expect(summaryContent.length).toBe(1);
      expect(summaryContent[0]?.content).toBe(content);
      expect(summaryContent[0]?.sections.length).toBe(2);
      expect(summaryContent[0]?.sections[0]?.title).toBe("Sec 1");
    });
  });

  describe("getGenerationForRetry", () => {
    it("should return generation data", async () => {
      const generation = await t.query(internal.workflows.generateSummary.getGenerationForRetry, {
        generationId,
      });

      expect(generation).not.toBeNull();
      expect(generation?._id).toBe(generationId);
      expect(generation?.name).toBe("Test Summary");
      expect(generation?.type).toBe("summary");
    });
  });
});
