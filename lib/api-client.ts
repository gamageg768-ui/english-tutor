'use client';

const BASE = '/api';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function req<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Server error (${res.status})`);
  }

  const data = await res.json();
  return data;
}

const get = <T>(path: string) => req<T>('GET', path);
const post = <T>(path: string, body: unknown) => req<T>('POST', path, body);
const del = <T>(path: string) => req<T>('DELETE', path);

// Auth
export const loginUser = (email: string, password: string) => post<{ success: boolean; token: string; user: { id: number; username: string; email: string } }>('/auth/login', { email, password });
export const registerUser = (username: string, email: string, password: string) => post<{ success: boolean; token: string; user: { id: number; username: string; email: string } }>('/auth/register', { username, email, password });
export const getCurrentUser = () => get<{ success: boolean; user: { id: number; username: string; email: string } }>('/auth/me');

// Situations
export const fetchSituations = () => get<{ success: boolean; situations: unknown[] }>('/situations');
export const generateCustomSituation = (description: string, level: string) => post<{ success: boolean; situation: unknown }>('/situations/generate', { description, level, timestamp: new Date().toISOString() });
export const saveCustomSituation = (situation: unknown) => post<{ success: boolean; situation: unknown }>('/situations/custom', { situation });
export const getCustomSituations = () => get<{ success: boolean; situations: unknown[] }>('/situations/custom');
export const syncData = (data: unknown) => post('/sync', data);

// Chat
export const sendMessage = (situation_id: string | number, message: string, history: unknown[]) => post('/chat', { situation_id, message, history });

// Conversations
export const getConversations = () => get<{ success: boolean; conversations: unknown[] }>('/conversations');
export const getConversation = (id: number) => get<{ success: boolean; conversation: unknown }>(`/conversations/${id}`);
export const saveConversation = (conv: unknown) => post<{ success: boolean; conversation_id: number }>('/conversations/save', conv);
export const analyzeConversation = (messages: unknown[], corrections: unknown[]) => post('/conversations/analyze', { messages, corrections });
export const summarizeConversations = (ids?: number[]) => post('/conversations/summary', { conversation_ids: ids });

// Corrections
export const getAllCorrections = () => get<{ success: boolean; corrections: unknown[] }>('/corrections');

// Stats & Analytics
export const getStats = () => get<{ success: boolean; stats: unknown }>('/stats');
export const getAnalytics = () => get<{ success: boolean; analytics: unknown }>('/progress/analytics');

// Vocabulary
export const getVocabulary = () => get<{ success: boolean; words: unknown[] }>('/vocabulary');
export const saveVocabulary = (wordData: unknown) => post('/vocabulary/save', wordData);
export const deleteVocabulary = (id: number) => del(`/vocabulary/${id}`);
export const extractVocabulary = (text: string, level: string) => post<{ success: boolean; words: unknown[] }>('/vocabulary/extract', { text, level });

// Flashcards
export const getFlashcards = (dueOnly = false) => get<{ success: boolean; flashcards: unknown[] }>(`/flashcards${dueOnly ? '?due_only=true' : ''}`);
export const createFlashcard = (data: unknown) => post('/flashcards/create', data);
export const reviewFlashcard = (card_id: number, quality: number) => post('/flashcards/review', { card_id, quality });

// Goals
export const getGoals = () => get<{ success: boolean; goals: unknown }>('/goals');
export const updateGoals = (progress: { conversations?: number; mcq_correct?: number }) => post('/goals/update', progress);

// Dictionary
export const lookupWord = (word: string) => post<{ success: boolean; word_info: unknown }>('/dictionary/lookup', { word });
export const getWordOfDay = () => get<{ success: boolean; word_of_day: unknown }>('/dictionary/word-of-day');
export const getPracticeSentences = (word: string, level = 'B1') => post('/dictionary/practice-sentence', { word, level });
export const getRelatedWords = (word: string) => post('/dictionary/related-words', { word });

// Grammar
export const checkWriting = (text: string, topic?: string) => post('/grammar/check', { text, topic });
export const generateGrammarPractice = (topic: string, level: string, type = 'fill_blank') => post('/grammar/practice', { topic, level, type });

// MCQ
export const generateMCQ = (topic: string, level: string, count = 5) => post<{ success: boolean; mcq_data: unknown }>('/mcq/generate', { topic, level, count });
export const getMCQHint = (question: string, options: string[], topic: string) => post('/mcq/hint', { question, options, topic });
export const generateMCQExplanation = (question: string, wrong_answer: string, correct_answer: string, topic: string) => post('/mcq/explain', { question, wrong_answer, correct_answer, topic });

// Writing
export const getWritingPrompt = (level: string, topic: string) => post('/writing/prompt', { level, topic });
export const evaluateWriting = (text: string, prompt: string, level: string) => post('/writing/evaluate', { text, prompt, level });

// Idioms
export const getIdioms = (category: string, level = 'B1') => post<{ success: boolean; data: unknown }>('/idioms/generate', { category, level });
export const getIdiomsQuiz = (category: string, level = 'B1') => post<{ success: boolean; quiz: unknown }>('/idioms/quiz', { category, level });

// Listening
export const getListeningExercise = (level: string, topic: string) => post<{ success: boolean; exercise: unknown }>('/listening/generate', { level, topic });

// Pronunciation
export const getPronunciationExercise = (difficulty: string) => post<{ success: boolean; exercises: unknown }>('/pronunciation/generate', { difficulty });

// Daily Challenge
export const getDailyChallenge = () => get<{ success: boolean; challenge: unknown }>('/daily-challenge');
export const completeDailyChallenge = (challenge_type: string, score: number) => post('/daily-challenge/complete', { challenge_type, score });

// Reading
export const getReadingExercise = (level: string, topic: string, passage_type: string) => post<{ success: boolean; exercise: unknown }>('/reading/generate', { level, topic, passage_type });
export const checkReadingAnswer = (passage: string, question: string, user_answer: string, level: string) => post('/reading/check-answers', { passage, question, user_answer, level });

// Debate
export const generateDebateTopic = (level: string, category: string) => post<{ success: boolean; debate: unknown }>('/debate/generate', { level, category });
export const submitDebateArgument = (topic: string, position: string, argument: string, history: unknown[], level: string) => post('/debate/respond', { topic, position, argument, history, level });
export const concludeDebate = (topic: string, position: string, exchanges: unknown[], level: string) => post('/debate/conclude', { topic, position, exchanges, level });

// Error Correction
export const generateErrorCorrection = (level: string, topic: string, error_count: number) => post<{ success: boolean; exercise: unknown }>('/error-correction/generate', { level, topic, error_count });
export const checkErrorCorrections = (user_corrections: unknown[], expected_errors: unknown[]) => post('/error-correction/check', { user_corrections, expected_errors });

// Sentence Builder
export const generateSentenceExercises = (level: string, exercise_type: string, grammar_focus: string, count: number) => post<{ success: boolean; data: unknown }>('/sentence-builder/generate', { level, exercise_type, grammar_focus, count });
export const checkSentence = (user_sentence: string, correct_sentence: string, exercise_type: string, level: string) => post('/sentence-builder/check', { user_sentence, correct_sentence, exercise_type, level });

// Collocations
export const getCollocations = (category: string, level: string) => post<{ success: boolean; data: unknown }>('/collocations/generate', { category, level });
export const getCollocationQuiz = (category: string, level: string, quiz_type: string) => post<{ success: boolean; quiz: unknown }>('/collocations/quiz', { category, level, quiz_type });
export const lookupCollocations = (word: string) => post('/collocations/lookup', { word });

// Insights
export const getAIRecommendations = () => get<{ success: boolean; recommendations: unknown }>('/insights/recommendations');
export const getWeeklyReport = () => get<{ success: boolean; report: unknown }>('/insights/weekly-report');

// Level
export const suggestLevel = (data: unknown) => post('/level/suggest', data);
