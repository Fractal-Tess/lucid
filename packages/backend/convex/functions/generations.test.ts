import { describe, it, expect, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import schema from "../schema";
import { modules } from "../test.setup";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

describe("generations integration tests", () => {
  let t: ReturnType<typeof convexTest>;
  let userId: Id<"users">;
  let subjectId: Id<"subjects">;
  let documentId: Id<"documents">;

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
      // First need to create a mock storage ID
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
  });

  describe("list", () => {
    it("should return empty array when no generations exist", async () => {
      const result = await t.query(api.functions.generations.list, { userId });
      expect(result).toEqual([]);
    });

    it("should return generations for the user", async () => {
      // Create a generation
      await t.run(async (ctx) => {
        await ctx.db.insert("generations", {
          userId,
          subjectId,
          sourceDocumentIds: [documentId],
          name: "Test Flashcards",
          type: "flashcards",
          status: "ready",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      const result = await t.query(api.functions.generations.list, { userId });
      expect(result.length).toBe(1);
      expect(result[0]?.name).toBe("Test Flashcards");
      expect(result[0]?.type).toBe("flashcards");
    });

    it("should not return generations for other users", async () => {
      // Create another user
      const otherUserId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          betterAuthId: "other-auth-id",
          email: "other@example.com",
          plan: "free",
          createdAt: Date.now(),
        });
      });

      // Create generation for other user
      await t.run(async (ctx) => {
        await ctx.db.insert("generations", {
          userId: otherUserId,
          subjectId,
          sourceDocumentIds: [documentId],
          name: "Other User Flashcards",
          type: "flashcards",
          status: "ready",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      const result = await t.query(api.functions.generations.list, { userId });
      expect(result.length).toBe(0);
    });
  });

  describe("listBySubject", () => {
    it("should return generations for a specific subject", async () => {
      await t.run(async (ctx) => {
        await ctx.db.insert("generations", {
          userId,
          subjectId,
          sourceDocumentIds: [documentId],
          name: "Subject Flashcards",
          type: "flashcards",
          status: "ready",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      const result = await t.query(api.functions.generations.listBySubject, { subjectId });
      expect(result.length).toBe(1);
      expect(result[0]?.name).toBe("Subject Flashcards");
    });
  });

  describe("listByType", () => {
    it("should return generations filtered by type", async () => {
      // Create flashcards generation
      await t.run(async (ctx) => {
        await ctx.db.insert("generations", {
          userId,
          subjectId,
          sourceDocumentIds: [documentId],
          name: "Flashcards",
          type: "flashcards",
          status: "ready",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      // Create quiz generation
      await t.run(async (ctx) => {
        await ctx.db.insert("generations", {
          userId,
          subjectId,
          sourceDocumentIds: [documentId],
          name: "Quiz",
          type: "quiz",
          status: "ready",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      const flashcards = await t.query(api.functions.generations.listByType, {
        userId,
        type: "flashcards",
      });
      expect(flashcards.length).toBe(1);
      expect(flashcards[0]?.type).toBe("flashcards");

      const quizzes = await t.query(api.functions.generations.listByType, {
        userId,
        type: "quiz",
      });
      expect(quizzes.length).toBe(1);
      expect(quizzes[0]?.type).toBe("quiz");
    });
  });

  describe("get", () => {
    it("should return a generation by ID", async () => {
      const generationId = await t.run(async (ctx) => {
        return await ctx.db.insert("generations", {
          userId,
          subjectId,
          sourceDocumentIds: [documentId],
          name: "Test Generation",
          type: "flashcards",
          status: "ready",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      const result = await t.query(api.functions.generations.get, { id: generationId });
      expect(result).not.toBeNull();
      expect(result?.name).toBe("Test Generation");
    });

    it("should return null for non-existent generation", async () => {
      // Create and immediately delete to get a valid but non-existent ID format
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

      const result = await t.query(api.functions.generations.get, { id: tempId });
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create a new generation with generating status", async () => {
      const generationId = await t.mutation(api.functions.generations.create, {
        userId,
        subjectId,
        sourceDocumentIds: [documentId],
        name: "New Flashcards",
        type: "flashcards",
      });

      const generation = await t.query(api.functions.generations.get, { id: generationId });
      expect(generation).not.toBeNull();
      expect(generation?.status).toBe("generating");
      expect(generation?.name).toBe("New Flashcards");
      expect(generation?.type).toBe("flashcards");
    });

    it("should throw error for non-existent document", async () => {
      // Create and delete a document to get a valid but non-existent ID
      const tempDocId = await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(new Blob(["test"]));
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

      await expect(
        t.mutation(api.functions.generations.create, {
          userId,
          subjectId,
          sourceDocumentIds: [tempDocId],
          name: "Invalid",
          type: "flashcards",
        }),
      ).rejects.toThrow("Document not found");
    });

    it("should throw error for document not ready", async () => {
      // Create a document that's still processing
      const processingDocId = await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(new Blob(["test"]));
        return await ctx.db.insert("documents", {
          userId,
          subjectId,
          name: "Processing.pdf",
          storageId,
          mimeType: "application/pdf",
          size: 100,
          status: "processing",
          createdAt: Date.now(),
        });
      });

      await expect(
        t.mutation(api.functions.generations.create, {
          userId,
          subjectId,
          sourceDocumentIds: [processingDocId],
          name: "From Processing Doc",
          type: "flashcards",
        }),
      ).rejects.toThrow("not ready for processing");
    });
  });

  describe("updateStatus", () => {
    it("should update generation status to ready", async () => {
      const generationId = await t.run(async (ctx) => {
        return await ctx.db.insert("generations", {
          userId,
          subjectId,
          sourceDocumentIds: [documentId],
          name: "Test",
          type: "flashcards",
          status: "generating",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      await t.mutation(api.functions.generations.updateStatus, {
        id: generationId,
        status: "ready",
      });

      const generation = await t.query(api.functions.generations.get, { id: generationId });
      expect(generation?.status).toBe("ready");
    });

    it("should update status to failed with error message", async () => {
      const generationId = await t.run(async (ctx) => {
        return await ctx.db.insert("generations", {
          userId,
          subjectId,
          sourceDocumentIds: [documentId],
          name: "Test",
          type: "flashcards",
          status: "generating",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      await t.mutation(api.functions.generations.updateStatus, {
        id: generationId,
        status: "failed",
        error: "AI generation failed",
      });

      const generation = await t.query(api.functions.generations.get, { id: generationId });
      expect(generation?.status).toBe("failed");
      expect(generation?.error).toBe("AI generation failed");
    });
  });

  describe("update", () => {
    it("should update generation name", async () => {
      const generationId = await t.run(async (ctx) => {
        return await ctx.db.insert("generations", {
          userId,
          subjectId,
          sourceDocumentIds: [documentId],
          name: "Original Name",
          type: "flashcards",
          status: "ready",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      await t.mutation(api.functions.generations.update, {
        id: generationId,
        name: "Updated Name",
      });

      const generation = await t.query(api.functions.generations.get, { id: generationId });
      expect(generation?.name).toBe("Updated Name");
    });
  });

  describe("remove", () => {
    it("should delete generation and associated flashcard items", async () => {
      // Create generation
      const generationId = await t.run(async (ctx) => {
        return await ctx.db.insert("generations", {
          userId,
          subjectId,
          sourceDocumentIds: [documentId],
          name: "To Delete",
          type: "flashcards",
          status: "ready",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      // Create flashcard items
      await t.run(async (ctx) => {
        await ctx.db.insert("flashcardItems", {
          generationId,
          userId,
          question: "Q1",
          answer: "A1",
          order: 0,
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReview: Date.now(),
          createdAt: Date.now(),
        });
        await ctx.db.insert("flashcardItems", {
          generationId,
          userId,
          question: "Q2",
          answer: "A2",
          order: 1,
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReview: Date.now(),
          createdAt: Date.now(),
        });
      });

      // Delete generation
      await t.mutation(api.functions.generations.remove, { id: generationId });

      // Verify generation is deleted
      const generation = await t.query(api.functions.generations.get, { id: generationId });
      expect(generation).toBeNull();

      // Verify flashcard items are deleted
      const flashcards = await t.run(async (ctx) => {
        return await ctx.db
          .query("flashcardItems")
          .withIndex("by_generation", (q) => q.eq("generationId", generationId))
          .collect();
      });
      expect(flashcards.length).toBe(0);
    });

    it("should throw error when deleting non-existent generation", async () => {
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

      await expect(t.mutation(api.functions.generations.remove, { id: tempId })).rejects.toThrow(
        "Generation not found",
      );
    });
  });
});
