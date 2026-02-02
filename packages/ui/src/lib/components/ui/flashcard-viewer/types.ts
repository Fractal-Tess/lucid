/**
 * Flashcard data structure
 */
export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

/**
 * Rating quality for SM-2 algorithm (0-5)
 * 0-2: Fail (forgot)
 * 3-5: Pass (remembered)
 */
export type CardRating = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Rating button configuration
 */
export interface RatingButton {
  value: CardRating;
  label: string;
  description: string;
  color: string;
}

/**
 * Default rating buttons following SM-2 algorithm
 */
export const DEFAULT_RATING_BUTTONS: RatingButton[] = [
  { value: 0, label: 'Again', description: 'Forgot', color: 'bg-destructive' },
  {
    value: 1,
    label: 'Hard',
    description: 'Barely remembered',
    color: 'bg-orange-500',
  },
  {
    value: 2,
    label: 'Medium',
    description: 'Some difficulty',
    color: 'bg-yellow-500',
  },
  { value: 3, label: 'Good', description: 'Remembered', color: 'bg-blue-500' },
  { value: 4, label: 'Easy', description: 'Easy', color: 'bg-green-500' },
  {
    value: 5,
    label: 'Perfect',
    description: 'Perfect recall',
    color: 'bg-emerald-500',
  },
];
