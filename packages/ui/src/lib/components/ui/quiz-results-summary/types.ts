export interface QuizItem {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface QuizAnswer {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
}

export interface QuizResults {
  score: number;
  total: number;
  correctAnswers: QuizAnswer[];
  wrongAnswers: QuizAnswer[];
}

export interface QuizResultsSummaryProps {
  questions: QuizItem[];
  results: QuizResults;
  duration?: number;
  showQuestionReview?: boolean;
  onRetakeQuiz?: () => void;
  onReviewQuestion?: (questionId: string) => void;
  onExportResults?: () => void;
  class?: string;
}

export interface QuestionReview {
  question: QuizItem;
  answer: QuizAnswer;
  showExplanation: boolean;
}

export interface QuizPerformanceMetrics {
  score: number;
  total: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  duration?: number;
  durationFormatted?: string;
}
