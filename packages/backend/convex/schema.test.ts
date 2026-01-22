import { describe, expect, it } from "vitest";
import schema from "./schema";

describe("Convex Schema", () => {
  it("should export a valid schema object", () => {
    expect(schema).toBeDefined();
    expect(schema.tables).toBeDefined();
  });

  describe("Organization Hierarchy Tables", () => {
    it("should define users table", () => {
      expect(schema.tables.users).toBeDefined();
    });

    it("should define subjectGroups table", () => {
      expect(schema.tables.subjectGroups).toBeDefined();
    });

    it("should define subjects table", () => {
      expect(schema.tables.subjects).toBeDefined();
    });

    it("should define folders table", () => {
      expect(schema.tables.folders).toBeDefined();
    });

    it("should define documents table", () => {
      expect(schema.tables.documents).toBeDefined();
    });
  });

  describe("Generation Tables", () => {
    it("should define generations table", () => {
      expect(schema.tables.generations).toBeDefined();
    });

    it("should define flashcardItems table", () => {
      expect(schema.tables.flashcardItems).toBeDefined();
    });

    it("should define quizItems table", () => {
      expect(schema.tables.quizItems).toBeDefined();
    });

    it("should define notesContent table", () => {
      expect(schema.tables.notesContent).toBeDefined();
    });

    it("should define summaryContent table", () => {
      expect(schema.tables.summaryContent).toBeDefined();
    });
  });

  describe("Phase 1 Tables", () => {
    it("should define studySessions table", () => {
      expect(schema.tables.studySessions).toBeDefined();
    });

    it("should define sharedDecks table", () => {
      expect(schema.tables.sharedDecks).toBeDefined();
    });
  });

  describe("Phase 2 Tables", () => {
    it("should define chatMessages table", () => {
      expect(schema.tables.chatMessages).toBeDefined();
    });

    it("should define solveQuestions table", () => {
      expect(schema.tables.solveQuestions).toBeDefined();
    });

    it("should define dailyStats table", () => {
      expect(schema.tables.dailyStats).toBeDefined();
    });

    it("should define streaks table", () => {
      expect(schema.tables.streaks).toBeDefined();
    });
  });

  describe("Phase 3 Tables", () => {
    it("should define studyGuideContent table", () => {
      expect(schema.tables.studyGuideContent).toBeDefined();
    });

    it("should define recordings table", () => {
      expect(schema.tables.recordings).toBeDefined();
    });

    it("should define notes table", () => {
      expect(schema.tables.notes).toBeDefined();
    });

    it("should define practiceProblems table", () => {
      expect(schema.tables.practiceProblems).toBeDefined();
    });

    it("should define conceptMapContent table", () => {
      expect(schema.tables.conceptMapContent).toBeDefined();
    });

    it("should define pomodoroSessions table", () => {
      expect(schema.tables.pomodoroSessions).toBeDefined();
    });
  });

  describe("Table count", () => {
    it("should have all 22 expected tables", () => {
      const tableNames = Object.keys(schema.tables);
      expect(tableNames).toHaveLength(22);

      const expectedTables = [
        "users",
        "subjectGroups",
        "subjects",
        "folders",
        "documents",
        "generations",
        "flashcardItems",
        "quizItems",
        "notesContent",
        "summaryContent",
        "studySessions",
        "sharedDecks",
        "chatMessages",
        "solveQuestions",
        "dailyStats",
        "streaks",
        "studyGuideContent",
        "recordings",
        "notes",
        "practiceProblems",
        "conceptMapContent",
        "pomodoroSessions",
      ];

      for (const table of expectedTables) {
        expect(tableNames).toContain(table);
      }
    });
  });
});
