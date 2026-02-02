export type GenerationType =
  | 'flashcards'
  | 'quiz'
  | 'notes'
  | 'summary'
  | 'study_guide'
  | 'concept_map';
export type GenerationStatus = 'generating' | 'ready' | 'failed';

export interface Generation {
  id: string;
  userId: string;
  subjectId: string;
  sourceDocumentIds: string[];
  name: string;
  type: GenerationType;
  status: GenerationStatus;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SourceDocument {
  id: string;
  name: string;
}

export interface GenerationsFolderProps {
  generations: Generation[];
  sourceDocuments: SourceDocument[];
  onGenerationClick: (generation: Generation) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onFilterByType?: (type: GenerationType | 'all') => void;
  onFilterBySource?: (documentId: string | 'all') => void;
}

export const generationTypeIcons: Record<GenerationType, string> = {
  flashcards: '🎴',
  quiz: '🧠',
  notes: '📝',
  summary: '📋',
  study_guide: '📚',
  concept_map: '🕸️',
};

export const generationTypeLabels: Record<GenerationType, string> = {
  flashcards: 'Flashcards',
  quiz: 'Quiz',
  notes: 'Notes',
  summary: 'Summary',
  study_guide: 'Study Guide',
  concept_map: 'Concept Map',
};
