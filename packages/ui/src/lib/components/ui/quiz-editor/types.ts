export interface EditableQuizItem {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  order: number;
}

export interface QuizEditorEvents {
  onCreate: (item: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  }) => void;
  onUpdate: (
    id: string,
    item: {
      question: string;
      options: string[];
      correctIndex: number;
      explanation?: string;
    },
  ) => void;
  onDelete: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
}
