/**
 * Gecko Level Check placement test questions.
 * Distribution: G:4, E:5, C:5, K:4, O:2
 * Weights: G=1, E=2, C=3, K=4, O=5
 */

export type QuestionType = 'multiple_choice' | 'sentence_ordering' | 'vocabulary' | 'writing';
export type GeckoLevel = 'G' | 'E' | 'C' | 'K' | 'O';

export const GEKO_WEIGHTS: Record<GeckoLevel, number> = {
  G: 1,
  E: 2,
  C: 3,
  K: 4,
  O: 5,
};

export const SCORE_TO_LEVEL: { max: number; level: GeckoLevel }[] = [
  { max: 10, level: 'G' },
  { max: 20, level: 'E' },
  { max: 30, level: 'C' },
  { max: 40, level: 'K' },
  { max: 999, level: 'O' },
];

export function scoreToLevel(totalScore: number): GeckoLevel {
  for (const { max, level } of SCORE_TO_LEVEL) {
    if (totalScore <= max) return level;
  }
  return 'O';
}

export interface Choice {
  value: string;
  label: string;
  correct?: boolean;
}

export interface PlacementQuestion {
  id: string;
  type: QuestionType;
  level: GeckoLevel;
  prompt: string;
  choices?: Choice[];
  /** For sentence_ordering: correct word order (space-separated) */
  correctOrder?: string[];
  /** For vocabulary: correct answer value */
  correctAnswer?: string;
  /** For writing: no auto-scoring; stored for review */
  placeholder?: string;
}

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  // G (4 questions)
  {
    id: 'g1',
    type: 'multiple_choice',
    level: 'G',
    prompt: 'What is the opposite of "hot"?',
    choices: [
      { value: 'a', label: 'Cold', correct: true },
      { value: 'b', label: 'Warm' },
      { value: 'c', label: 'Big' },
      { value: 'd', label: 'Fast' },
    ],
  },
  {
    id: 'g2',
    type: 'multiple_choice',
    level: 'G',
    prompt: 'Which word is a greeting?',
    choices: [
      { value: 'a', label: 'Goodbye' },
      { value: 'b', label: 'Hello', correct: true },
      { value: 'c', label: 'Sorry' },
      { value: 'd', label: 'Thanks' },
    ],
  },
  {
    id: 'g3',
    type: 'sentence_ordering',
    level: 'G',
    prompt: 'Arrange the words to make a sentence.',
    correctOrder: ['I', 'am', 'a', 'student'],
  },
  {
    id: 'g4',
    type: 'vocabulary',
    level: 'G',
    prompt: 'What does "book" mean?',
    choices: [
      { value: 'a', label: 'A written work you read', correct: true },
      { value: 'b', label: 'Something you eat' },
      { value: 'c', label: 'A place to live' },
      { value: 'd', label: 'A type of vehicle' },
    ],
  },

  // E (5 questions)
  {
    id: 'e1',
    type: 'multiple_choice',
    level: 'E',
    prompt: 'Choose the correct sentence:',
    choices: [
      { value: 'a', label: 'She go to school every day' },
      { value: 'b', label: 'She goes to school every day', correct: true },
      { value: 'c', label: 'She going to school every day' },
      { value: 'd', label: 'She gone to school every day' },
    ],
  },
  {
    id: 'e2',
    type: 'multiple_choice',
    level: 'E',
    prompt: "What is the past tense of 'run'?",
    choices: [
      { value: 'a', label: 'Runned' },
      { value: 'b', label: 'Running' },
      { value: 'c', label: 'Ran', correct: true },
      { value: 'd', label: 'Run' },
    ],
  },
  {
    id: 'e3',
    type: 'sentence_ordering',
    level: 'E',
    prompt: 'Arrange the words to make a question.',
    correctOrder: ['Where', 'do', 'you', 'live'],
  },
  {
    id: 'e4',
    type: 'vocabulary',
    level: 'E',
    prompt: 'What does "hungry" mean?',
    choices: [
      { value: 'a', label: 'Wanting to eat', correct: true },
      { value: 'b', label: 'Feeling tired' },
      { value: 'c', label: 'Feeling happy' },
      { value: 'd', label: 'Wanting to sleep' },
    ],
  },
  {
    id: 'e5',
    type: 'multiple_choice',
    level: 'E',
    prompt: 'Choose the correct article: "I have ___ apple."',
    choices: [
      { value: 'a', label: 'a', correct: true },
      { value: 'b', label: 'an', correct: true },
      { value: 'c', label: 'the' },
      { value: 'd', label: 'no article' },
    ],
  },

  // C (5 questions)
  {
    id: 'c1',
    type: 'multiple_choice',
    level: 'C',
    prompt: 'Which sentence is correct?',
    choices: [
      { value: 'a', label: 'If it will rain, I will stay home' },
      { value: 'b', label: 'If it rains, I will stay home', correct: true },
      { value: 'c', label: 'If it rain, I will stay home' },
      { value: 'd', label: 'If it raining, I will stay home' },
    ],
  },
  {
    id: 'c2',
    type: 'sentence_ordering',
    level: 'C',
    prompt: 'Arrange to form a complete sentence.',
    correctOrder: ['She', 'has', 'been', 'learning', 'English', 'for', 'two', 'years'],
  },
  {
    id: 'c3',
    type: 'vocabulary',
    level: 'C',
    prompt: 'What does "postpone" mean?',
    choices: [
      { value: 'a', label: 'To delay or put off until later', correct: true },
      { value: 'b', label: 'To finish quickly' },
      { value: 'c', label: 'To cancel completely' },
      { value: 'd', label: 'To start immediately' },
    ],
  },
  {
    id: 'c4',
    type: 'multiple_choice',
    level: 'C',
    prompt: 'Choose the best response: "Would you like some tea?"',
    choices: [
      { value: 'a', label: 'Yes, I would like', correct: true },
      { value: 'b', label: 'Yes, I like' },
      { value: 'c', label: 'Yes, I would' },
      { value: 'd', label: 'Yes, I would like some', correct: true },
    ],
  },
  {
    id: 'c5',
    type: 'vocabulary',
    level: 'C',
    prompt: 'What does "negotiate" mean?',
    choices: [
      { value: 'a', label: 'To discuss to reach an agreement', correct: true },
      { value: 'b', label: 'To argue loudly' },
      { value: 'c', label: 'To ignore completely' },
      { value: 'd', label: 'To agree immediately' },
    ],
  },

  // K (4 questions)
  {
    id: 'k1',
    type: 'multiple_choice',
    level: 'K',
    prompt: 'Which sentence uses the subjunctive correctly?',
    choices: [
      { value: 'a', label: 'I wish I was taller' },
      { value: 'b', label: 'I wish I were taller', correct: true },
      { value: 'c', label: 'I wish I am taller' },
      { value: 'd', label: 'I wish I be taller' },
    ],
  },
  {
    id: 'k2',
    type: 'vocabulary',
    level: 'K',
    prompt: 'What does "meticulous" mean?',
    choices: [
      { value: 'a', label: 'Very careful and precise', correct: true },
      { value: 'b', label: 'Very fast' },
      { value: 'c', label: 'Very lazy' },
      { value: 'd', label: 'Very loud' },
    ],
  },
  {
    id: 'k3',
    type: 'sentence_ordering',
    level: 'K',
    prompt: 'Arrange to form a grammatically correct sentence.',
    correctOrder: ['Despite', 'the', 'rain', ',', 'we', 'decided', 'to', 'go', 'hiking'],
  },
  {
    id: 'k4',
    type: 'multiple_choice',
    level: 'K',
    prompt: 'Choose the correct phrasal verb: "The meeting was ___ due to bad weather."',
    choices: [
      { value: 'a', label: 'called off', correct: true },
      { value: 'b', label: 'called on' },
      { value: 'c', label: 'called up' },
      { value: 'd', label: 'called in' },
    ],
  },

  // O (2 questions)
  {
    id: 'o1',
    type: 'writing',
    level: 'O',
    prompt: 'Write 2–3 sentences about a skill you have learned and how it helped you.',
    placeholder: 'Type your response here...',
  },
  {
    id: 'o2',
    type: 'vocabulary',
    level: 'O',
    prompt: 'What does "ubiquitous" mean?',
    choices: [
      { value: 'a', label: 'Present everywhere', correct: true },
      { value: 'b', label: 'Very rare' },
      { value: 'c', label: 'Temporarily absent' },
      { value: 'd', label: 'Recently invented' },
    ],
  },
];

// Fix e5: "a" and "an" - for "apple" the correct answer is "an"
PLACEMENT_QUESTIONS.find((q) => q.id === 'e5')!.choices = [
  { value: 'a', label: 'a' },
  { value: 'an', label: 'an', correct: true },
  { value: 'the', label: 'the' },
  { value: 'no', label: 'no article' },
];

// Fix c4: Single correct response
PLACEMENT_QUESTIONS.find((q) => q.id === 'c4')!.choices = [
  { value: 'a', label: 'Yes, I would like some', correct: true },
  { value: 'b', label: 'Yes, I like' },
  { value: 'c', label: 'Yes, I would' },
  { value: 'd', label: 'Yes, please' },
];
