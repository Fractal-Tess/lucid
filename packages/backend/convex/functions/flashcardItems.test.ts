import { describe, it, expect, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import schema from "../schema";
import { modules } from "../test.setup";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { calculateSM2 } from "./flashcardItems";

// ============================================
// Unit Tests for SM-2 Algorithm (Pure Logic)
// ============================================

describe("SM-2 Algorithm (unit tests)", () => {
  describe("calculateSM2", () => {
    it("should handle first correct review (quality >= 3)", () => {
      const result = calculateSM2({
        quality: 4,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
      });

      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
      expect(result.nextReview).toBeGreaterThan(Date.now());
    });

    it("should handle second correct review", () => {
      const result = calculateSM2({
        quality: 4,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
      });

      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
    });

    it("should handle third+ correct review with ease factor multiplication", () => {
      const result = calculateSM2({
        quality: 4,
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      });

      expect(result.interval).toBe(15); // Math.round(6 * 2.5)
      expect(result.repetitions).toBe(3);
    });

    it("should reset on incorrect response (quality < 3)", () => {
      const result = calculateSM2({
        quality: 2,
        easeFactor: 2.5,
        interval: 15,
        repetitions: 5,
      });

      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);
    });

    it("should update ease factor based on quality", () => {
      // Quality 5 increases ease factor
      const result5 = calculateSM2({
        quality: 5,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
      });
      expect(result5.easeFactor).toBeGreaterThan(2.5);

      // Quality 3 decreases ease factor
      const result3 = calculateSM2({
        quality: 3,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
      });
      expect(result3.easeFactor).toBeLessThan(2.5);

      // Quality 0 significantly decreases ease factor
      const result0 = calculateSM2({
        quality: 0,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
      });
      expect(result0.easeFactor).toBeLessThan(result3.easeFactor);
    });

    it("should never allow ease factor below 1.3", () => {
      const result = calculateSM2({
        quality: 0,
        easeFactor: 1.3,
        interval: 1,
        repetitions: 0,
      });

      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it("should calculate nextReview timestamp correctly", () => {
      const before = Date.now();
      const result = calculateSM2({
        quality: 4,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
      });
      const after = Date.now();

      // nextReview should be approximately 6 days from now (interval * 24h)
      const sixDaysMs = 6 * 24 * 60 * 60 * 1000;
      expect(result.nextReview).toBeGreaterThanOrEqual(before + sixDaysMs - 1000);
      expect(result.nextReview).toBeLessThanOrEqual(after + sixDaysMs + 1000);
    });

    it("should handle quality rating of exactly 3 (pass threshold)", () => {
      const result = calculateSM2({
        quality: 3,
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      });

      expect(result.repetitions).toBe(3);
      expect(result.interval).toBeGreaterThan(6);
    });

    it("should handle quality rating of exactly 2 (fail threshold)", () => {
      const result = calculateSM2({
        quality: 2,
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      });

      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
    });
  });
});

// ============================================
// Integration Tests for flashcardItems functions
// ============================================

describe("flashcardItems integration tests", () => {
  let t: ReturnType<typeof convexTest>;
  let userId: Id<"users">;
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
    const subjectId = await t.run(async (ctx) => {
      return await ctx.db.insert("subjects", {
        userId,
        name: "Test Subject",
        order: 0,
        createdAt: Date.now(),
      });
    });

    // Create test document
    const documentId = await t.run(async (ctx) => {
      const storageId = await ctx.storage.store(new Blob(["test content"]));
      return await ctx.db.insert("documents", {
        userId,
        subjectId,
        name: "Test.pdf",
        storageId,
        mimeType: "application/pdf",
        size: 1024,
        status: "ready",
        extractedText: "Test content",
        createdAt: Date.now(),
      });
    });

    // Create test flashcard generation
    generationId = await t.run(async (ctx) => {
      return await ctx.db.insert("generations", {
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
  });

  describe("listByGeneration", () => {
    it("should return empty array when no flashcards exist", async () => {
      const result = await t.query(api.functions.flashcardItems.listByGeneration, { generationId });
      expect(result).toEqual([]);
    });

    it("should return all flashcards for a generation", async () => {
      // Create flashcards
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

      const result = await t.query(api.functions.flashcardItems.listByGeneration, { generationId });
      expect(result.length).toBe(2);
    });
  });

  describe("getDueCards", () => {
    it("should return cards due for review", async () => {
      const now = Date.now();

      // Create a due card (nextReview in the past)
      await t.run(async (ctx) => {
        await ctx.db.insert("flashcardItems", {
          generationId,
          userId,
          question: "Due Card",
          answer: "Answer",
          order: 0,
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReview: now - 1000, // Past
          createdAt: Date.now(),
        });
      });

      // Create a future card (not due)
      await t.run(async (ctx) => {
        await ctx.db.insert("flashcardItems", {
          generationId,
          userId,
          question: "Future Card",
          answer: "Answer",
          order: 1,
          easeFactor: 2.5,
          interval: 1,
          repetitions: 1,
          nextReview: now + 86400000, // Tomorrow
          createdAt: Date.now(),
        });
      });

      const dueCards = await t.query(api.functions.flashcardItems.getDueCards, { userId });
      expect(dueCards.length).toBe(1);
      expect(dueCards[0]?.question).toBe("Due Card");
    });

    it("should respect the limit parameter", async () => {
      const now = Date.now();

      // Create multiple due cards
      await t.run(async (ctx) => {
        for (let i = 0; i < 5; i++) {
          await ctx.db.insert("flashcardItems", {
            generationId,
            userId,
            question: `Card ${i}`,
            answer: `Answer ${i}`,
            order: i,
            easeFactor: 2.5,
            interval: 0,
            repetitions: 0,
            nextReview: now - 1000,
            createdAt: Date.now(),
          });
        }
      });

      const limitedCards = await t.query(api.functions.flashcardItems.getDueCards, {
        userId,
        limit: 3,
      });
      expect(limitedCards.length).toBe(3);
    });
  });

  describe("get", () => {
    it("should return a flashcard by ID", async () => {
      const flashcardId = await t.run(async (ctx) => {
        return await ctx.db.insert("flashcardItems", {
          generationId,
          userId,
          question: "What is X?",
          answer: "X is Y",
          order: 0,
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReview: Date.now(),
          createdAt: Date.now(),
        });
      });

      const result = await t.query(api.functions.flashcardItems.get, { id: flashcardId });
      expect(result).not.toBeNull();
      expect(result?.question).toBe("What is X?");
      expect(result?.answer).toBe("X is Y");
    });
  });

  describe("create", () => {
    it("should create a flashcard with default SM-2 values", async () => {
      const flashcardId = await t.mutation(api.functions.flashcardItems.create, {
        generationId,
        userId,
        question: "New Question",
        answer: "New Answer",
        order: 0,
      });

      const flashcard = await t.query(api.functions.flashcardItems.get, { id: flashcardId });
      expect(flashcard).not.toBeNull();
      expect(flashcard?.easeFactor).toBe(2.5);
      expect(flashcard?.interval).toBe(0);
      expect(flashcard?.repetitions).toBe(0);
    });

    it("should reject creation for non-flashcard generation", async () => {
      // Create a quiz generation
      const quizGenerationId = await t.run(async (ctx) => {
        const subjectId = await ctx.db.insert("subjects", {
          userId,
          name: "Quiz Subject",
          order: 1,
          createdAt: Date.now(),
        });
        return await ctx.db.insert("generations", {
          userId,
          subjectId,
          sourceDocumentIds: [],
          name: "Quiz Gen",
          type: "quiz",
          status: "ready",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      await expect(
        t.mutation(api.functions.flashcardItems.create, {
          generationId: quizGenerationId,
          userId,
          question: "Q",
          answer: "A",
          order: 0,
        }),
      ).rejects.toThrow("not a flashcard generation");
    });
  });

  describe("createBatch", () => {
    it("should create multiple flashcards with sequential order", async () => {
      const items = [
        { question: "Q1", answer: "A1" },
        { question: "Q2", answer: "A2" },
        { question: "Q3", answer: "A3" },
      ];

      const ids = await t.mutation(api.functions.flashcardItems.createBatch, {
        generationId,
        userId,
        items,
      });

      expect(ids.length).toBe(3);

      const flashcards = await t.query(api.functions.flashcardItems.listByGeneration, {
        generationId,
      });
      expect(flashcards.length).toBe(3);

      // Verify order
      const sorted = flashcards.sort((a, b) => a.order - b.order);
      expect(sorted[0]?.question).toBe("Q1");
      expect(sorted[0]?.order).toBe(0);
      expect(sorted[1]?.question).toBe("Q2");
      expect(sorted[1]?.order).toBe(1);
      expect(sorted[2]?.question).toBe("Q3");
      expect(sorted[2]?.order).toBe(2);
    });
  });

  describe("update", () => {
    it("should update flashcard question and answer", async () => {
      const flashcardId = await t.run(async (ctx) => {
        return await ctx.db.insert("flashcardItems", {
          generationId,
          userId,
          question: "Original Q",
          answer: "Original A",
          order: 0,
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReview: Date.now(),
          createdAt: Date.now(),
        });
      });

      await t.mutation(api.functions.flashcardItems.update, {
        id: flashcardId,
        question: "Updated Q",
        answer: "Updated A",
      });

      const flashcard = await t.query(api.functions.flashcardItems.get, { id: flashcardId });
      expect(flashcard?.question).toBe("Updated Q");
      expect(flashcard?.answer).toBe("Updated A");
    });
  });

  describe("recordReview", () => {
    it("should update SM-2 values after a correct review", async () => {
      const flashcardId = await t.run(async (ctx) => {
        return await ctx.db.insert("flashcardItems", {
          generationId,
          userId,
          question: "Q",
          answer: "A",
          order: 0,
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReview: Date.now(),
          createdAt: Date.now(),
        });
      });

      const result = await t.mutation(api.functions.flashcardItems.recordReview, {
        id: flashcardId,
        quality: 4, // Good
      });

      expect(result.interval).toBe(1);
      expect(result.nextReview).toBeGreaterThan(Date.now());

      const flashcard = await t.query(api.functions.flashcardItems.get, { id: flashcardId });
      expect(flashcard?.interval).toBe(1);
      expect(flashcard?.repetitions).toBe(1);
    });

    it("should reset progress after incorrect review", async () => {
      const flashcardId = await t.run(async (ctx) => {
        return await ctx.db.insert("flashcardItems", {
          generationId,
          userId,
          question: "Q",
          answer: "A",
          order: 0,
          easeFactor: 2.5,
          interval: 6,
          repetitions: 3,
          nextReview: Date.now(),
          createdAt: Date.now(),
        });
      });

      await t.mutation(api.functions.flashcardItems.recordReview, {
        id: flashcardId,
        quality: 2, // Fail
      });

      const flashcard = await t.query(api.functions.flashcardItems.get, { id: flashcardId });
      expect(flashcard?.interval).toBe(1);
      expect(flashcard?.repetitions).toBe(0);
    });

    it("should reject invalid quality values", async () => {
      const flashcardId = await t.run(async (ctx) => {
        return await ctx.db.insert("flashcardItems", {
          generationId,
          userId,
          question: "Q",
          answer: "A",
          order: 0,
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReview: Date.now(),
          createdAt: Date.now(),
        });
      });

      await expect(
        t.mutation(api.functions.flashcardItems.recordReview, {
          id: flashcardId,
          quality: 6, // Invalid
        }),
      ).rejects.toThrow("Quality must be between 0 and 5");

      await expect(
        t.mutation(api.functions.flashcardItems.recordReview, {
          id: flashcardId,
          quality: -1, // Invalid
        }),
      ).rejects.toThrow("Quality must be between 0 and 5");
    });
  });

  describe("reorder", () => {
    it("should reorder flashcards within a generation", async () => {
      // Create flashcards
      const ids = await t.run(async (ctx) => {
        const id1 = await ctx.db.insert("flashcardItems", {
          generationId,
          userId,
          question: "First",
          answer: "A1",
          order: 0,
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReview: Date.now(),
          createdAt: Date.now(),
        });
        const id2 = await ctx.db.insert("flashcardItems", {
          generationId,
          userId,
          question: "Second",
          answer: "A2",
          order: 1,
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReview: Date.now(),
          createdAt: Date.now(),
        });
        const id3 = await ctx.db.insert("flashcardItems", {
          generationId,
          userId,
          question: "Third",
          answer: "A3",
          order: 2,
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReview: Date.now(),
          createdAt: Date.now(),
        });
        return [id1, id2, id3];
      });

      // Reorder: Third -> First -> Second
      await t.mutation(api.functions.flashcardItems.reorder, {
        generationId,
        orderedIds: [ids[2]!, ids[0]!, ids[1]!],
      });

      const flashcards = await t.query(api.functions.flashcardItems.listByGeneration, {
        generationId,
      });
      const sorted = flashcards.sort((a, b) => a.order - b.order);

      expect(sorted[0]?.question).toBe("Third");
      expect(sorted[1]?.question).toBe("First");
      expect(sorted[2]?.question).toBe("Second");
    });
  });

  describe("remove", () => {
    it("should delete a flashcard", async () => {
      const flashcardId = await t.run(async (ctx) => {
        return await ctx.db.insert("flashcardItems", {
          generationId,
          userId,
          question: "To Delete",
          answer: "Answer",
          order: 0,
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReview: Date.now(),
          createdAt: Date.now(),
        });
      });

      await t.mutation(api.functions.flashcardItems.remove, { id: flashcardId });

      const flashcard = await t.query(api.functions.flashcardItems.get, { id: flashcardId });
      expect(flashcard).toBeNull();
    });

    it("should throw error when deleting non-existent flashcard", async () => {
      const tempId = await t.run(async (ctx) => {
        const id = await ctx.db.insert("flashcardItems", {
          generationId,
          userId,
          question: "Temp",
          answer: "A",
          order: 0,
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReview: Date.now(),
          createdAt: Date.now(),
        });
        await ctx.db.delete(id);
        return id;
      });

      await expect(t.mutation(api.functions.flashcardItems.remove, { id: tempId })).rejects.toThrow(
        "Flashcard item not found",
      );
    });
  });
});
