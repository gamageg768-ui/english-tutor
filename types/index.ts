export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Situation {
  id: number | string;
  title: string;
  domain: string;
  module: string;
  level: string;
  role: string;
  context?: string;
  description?: string;
  user_role?: string;
  goal?: string;
  system_prompt?: string;
  is_custom?: boolean;
  created_at?: string;
}

export interface Correction {
  wrong: string;
  correct: string;
  reason: string;
  category?: string;
}

export interface ChatResponse {
  success: boolean;
  reply: string;
  corrections: Correction[];
  encouragement: string;
  follow_up: string;
  level: string;
  goal_progress: 'in_progress' | 'advancing' | 'complete';
  situation: {
    id: number | string;
    title: string;
    role: string;
    level: string;
    domain: string;
    module: string;
  };
  error?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'tutor';
  content: string;
  corrections?: Correction[];
  encouragement?: string;
  timestamp: Date;
}

export interface WritingEvaluation {
  scores: { grammar: number; vocabulary: number; coherence: number; style: number; task_completion: number; overall: number };
  corrections: Array<{ original: string; corrected: string; explanation: string }>;
  suggestions: string[];
  strengths: string[];
  improved_version: string;
  summary: string;
}

export interface ListeningExercise {
  title: string;
  passage: string;
  level: string;
  topic: string;
  questions: Array<{ question: string; options: string[]; correct_answer: string; explanation: string }>;
  key_vocabulary: string[];
}

export interface ReadingExercise {
  title: string;
  passage: string;
  word_count: number;
  level: string;
  topic: string;
  passage_type: string;
  questions: Array<{ type: string; question: string; options?: string[]; correct_answer: string; explanation: string; skill: string }>;
  vocabulary: Array<{ word: string; definition: string; context_sentence: string }>;
  summary_prompt: string;
}

export interface DebateTopic {
  topic: string;
  your_position: 'for' | 'against';
  background: string;
  key_points: string[];
  useful_phrases: string[];
}

export interface ErrorCorrectionExercise {
  passage_with_errors: string;
  correct_passage: string;
  error_count: number;
  errors: Array<{ wrong: string; correct: string; type: string; explanation: string }>;
  topic: string;
  level: string;
}

export interface SentenceExercise {
  type: string;
  scrambled_words?: string[];
  sentence_with_blanks?: string;
  correct_sentence: string;
  hint: string;
  grammar_point: string;
  explanation?: string;
}
