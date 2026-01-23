import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/svelte";
import QuizResultsSummary from "../src/lib/components/ui/quiz-results-summary/quiz-results-summary.svelte";
import type { QuizItem, QuizResults } from "../src/lib/components/ui/quiz-results-summary/types.js";

describe("QuizResultsSummary", () => {
  const sampleQuestions: QuizItem[] = [
    {
      id: "1",
      question: "What is the capital of France?",
      options: ["London", "Paris", "Berlin", "Madrid"],
      correctIndex: 1,
      explanation: "Paris is the capital of France.",
    },
    {
      id: "2",
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctIndex: 1,
      explanation: "2 plus 2 equals 4.",
    },
    {
      id: "3",
      question: "What is the largest planet?",
      options: ["Earth", "Mars", "Jupiter", "Saturn"],
      correctIndex: 2,
      explanation: "Jupiter is the largest planet.",
    },
  ];

  const sampleResults: QuizResults = {
    score: 2,
    total: 3,
    correctAnswers: [
      { questionId: "1", selectedIndex: 1, isCorrect: true },
      { questionId: "3", selectedIndex: 2, isCorrect: true },
    ],
    wrongAnswers: [{ questionId: "2", selectedIndex: 0, isCorrect: false }],
  };

  describe("Basic Rendering", () => {
    it("should render quiz complete message", () => {
      render(QuizResultsSummary, {
        props: { questions: sampleQuestions, results: sampleResults },
      });

      expect(screen.getByText("Quiz Complete!")).toBeInTheDocument();
    });

    it("should display correct score", () => {
      render(QuizResultsSummary, {
        props: { questions: sampleQuestions, results: sampleResults },
      });

      expect(screen.getByText("67%")).toBeInTheDocument();
    });

    it("should display score fraction", () => {
      render(QuizResultsSummary, {
        props: { questions: sampleQuestions, results: sampleResults },
      });

      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("should display correct answer count", () => {
      render(QuizResultsSummary, {
        props: { questions: sampleQuestions, results: sampleResults },
      });

      expect(screen.getByText("Correct").nextElementSibling).toHaveTextContent("2");
    });

    it("should display incorrect answer count", () => {
      render(QuizResultsSummary, {
        props: { questions: sampleQuestions, results: sampleResults },
      });

      expect(screen.getByText("Incorrect").nextElementSibling).toHaveTextContent("1");
    });
  });

  describe("Performance Labels", () => {
    it("should show Excellent for 90%+", () => {
      const excellentResults: QuizResults = {
        score: 9,
        total: 10,
        correctAnswers: Array.from({ length: 9 }, (_, i) => ({
          questionId: `${i + 1}`,
          selectedIndex: 0,
          isCorrect: true,
        })),
        wrongAnswers: [{ questionId: "10", selectedIndex: 0, isCorrect: false }],
      };

      render(QuizResultsSummary, {
        props: { questions: sampleQuestions, results: excellentResults },
      });

      expect(screen.getByText("Excellent!")).toBeInTheDocument();
    });

    it("should show Great job for 80-89%", () => {
      const goodResults: QuizResults = {
        score: 8,
        total: 10,
        correctAnswers: Array.from({ length: 8 }, (_, i) => ({
          questionId: `${i + 1}`,
          selectedIndex: 0,
          isCorrect: true,
        })),
        wrongAnswers: [
          { questionId: "9", selectedIndex: 0, isCorrect: false },
          { questionId: "10", selectedIndex: 0, isCorrect: false },
        ],
      };

      render(QuizResultsSummary, {
        props: { questions: sampleQuestions, results: goodResults },
      });

      expect(screen.getByText("Great job!")).toBeInTheDocument();
    });

    it("should show Keep studying for below 60%", () => {
      const poorResults: QuizResults = {
        score: 1,
        total: 3,
        correctAnswers: [{ questionId: "1", selectedIndex: 1, isCorrect: true }],
        wrongAnswers: [
          { questionId: "2", selectedIndex: 0, isCorrect: false },
          { questionId: "3", selectedIndex: 0, isCorrect: false },
        ],
      };

      render(QuizResultsSummary, {
        props: { questions: sampleQuestions, results: poorResults },
      });

      expect(screen.getByText("Keep studying!")).toBeInTheDocument();
    });
  });

  describe("Duration Display", () => {
    it("should display duration in minutes when >= 60 seconds", () => {
      render(QuizResultsSummary, {
        props: { questions: sampleQuestions, results: sampleResults, duration: 120 },
      });

      expect(screen.getByText("2m 0s")).toBeInTheDocument();
    });

    it("should display duration in seconds when < 60 seconds", () => {
      render(QuizResultsSummary, {
        props: { questions: sampleQuestions, results: sampleResults, duration: 45 },
      });

      expect(screen.getByText("45s")).toBeInTheDocument();
    });

    it("should not display time when duration is not provided", () => {
      render(QuizResultsSummary, {
        props: { questions: sampleQuestions, results: sampleResults },
      });

      expect(screen.queryByText(/Time/)).not.toBeInTheDocument();
    });
  });

  describe("Action Buttons", () => {
    it("should show retake quiz button when callback provided", () => {
      const retakeMock = vi.fn();

      render(QuizResultsSummary, {
        props: {
          questions: sampleQuestions,
          results: sampleResults,
          onRetakeQuiz: retakeMock,
        },
      });

      const retakeButton = screen.getByText("Retake Quiz");
      expect(retakeButton).toBeInTheDocument();
    });

    it("should call onRetakeQuiz when retake button is clicked", async () => {
      const retakeMock = vi.fn();
      const { container } = render(QuizResultsSummary, {
        props: {
          questions: sampleQuestions,
          results: sampleResults,
          onRetakeQuiz: retakeMock,
        },
      });

      const retakeButton = screen.getByText("Retake Quiz");
      await retakeButton.click();

      expect(retakeMock).toHaveBeenCalledTimes(1);
    });

    it("should show export button when callback provided", () => {
      const exportMock = vi.fn();

      render(QuizResultsSummary, {
        props: {
          questions: sampleQuestions,
          results: sampleResults,
          onExportResults: exportMock,
        },
      });

      expect(screen.getByText("Export Results")).toBeInTheDocument();
    });

    it("should call onExportResults when export button is clicked", async () => {
      const exportMock = vi.fn();

      render(QuizResultsSummary, {
        props: {
          questions: sampleQuestions,
          results: sampleResults,
          onExportResults: exportMock,
        },
      });

      const exportButton = screen.getByText("Export Results");
      await exportButton.click();

      expect(exportMock).toHaveBeenCalledTimes(1);
    });

    it("should not show action buttons when callbacks not provided", () => {
      render(QuizResultsSummary, {
        props: { questions: sampleQuestions, results: sampleResults },
      });

      expect(screen.queryByText("Retake Quiz")).not.toBeInTheDocument();
      expect(screen.queryByText("Export Results")).not.toBeInTheDocument();
    });
  });

  describe("Question Review", () => {
    it("should show question review section by default", () => {
      render(QuizResultsSummary, {
        props: { questions: sampleQuestions, results: sampleResults },
      });

      expect(screen.getByText("Question Review")).toBeInTheDocument();
    });

    it("should not show question review when showQuestionReview is false", () => {
      render(QuizResultsSummary, {
        props: {
          questions: sampleQuestions,
          results: sampleResults,
          showQuestionReview: false,
        },
      });

      expect(screen.queryByText("Question Review")).not.toBeInTheDocument();
    });

    it("should display all questions with answers", () => {
      render(QuizResultsSummary, {
        props: { questions: sampleQuestions, results: sampleResults },
      });

      expect(screen.getByText("What is the capital of France?")).toBeInTheDocument();
      expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
      expect(screen.getByText("What is the largest planet?")).toBeInTheDocument();
    });

    it("should show correct badge for correct answers", () => {
      render(QuizResultsSummary, {
        props: { questions: sampleQuestions, results: sampleResults },
      });

      const correctBadges = screen.getAllByText("Correct");
      expect(correctBadges.length).toBeGreaterThan(0);

      const correctBadgesWithSuccess = correctBadges.filter((badge) =>
        badge.classList.contains("bg-green-100"),
      );
      expect(correctBadgesWithSuccess.length).toBeGreaterThan(0);
    });

    it("should show incorrect badge for wrong answers", () => {
      render(QuizResultsSummary, {
        props: { questions: sampleQuestions, results: sampleResults },
      });

      const incorrectBadges = screen.getAllByText("Incorrect");
      const incorrectBadgesWithError = incorrectBadges.filter((badge) =>
        badge.classList.contains("bg-red-100"),
      );
      expect(incorrectBadgesWithError.length).toBeGreaterThan(0);
    });

    it("should show correct answer for wrong answers", () => {
      render(QuizResultsSummary, {
        props: { questions: sampleQuestions, results: sampleResults },
      });

      expect(screen.getByText("Correct: 4")).toBeInTheDocument();
    });

    it("should expand question review when clicked", async () => {
      render(QuizResultsSummary, {
        props: { questions: sampleQuestions, results: sampleResults },
      });

      const questionItem = screen.getByTestId("question-review-0");
      const button = questionItem.querySelector("button");

      await button?.click();

      expect(screen.getByText("(Correct answer)")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should not show question review when no answers", () => {
      const emptyResults: QuizResults = {
        score: 0,
        total: 0,
        correctAnswers: [],
        wrongAnswers: [],
      };

      render(QuizResultsSummary, {
        props: { questions: [], results: emptyResults },
      });

      expect(screen.queryByText("Question Review")).not.toBeInTheDocument();
    });

    it("should handle zero total questions", () => {
      const emptyResults: QuizResults = {
        score: 0,
        total: 0,
        correctAnswers: [],
        wrongAnswers: [],
      };

      render(QuizResultsSummary, {
        props: { questions: [], results: emptyResults },
      });

      expect(screen.getByText("0%")).toBeInTheDocument();
    });
  });
});
