export type QuestionType = 'mcq' | 'mrx' | 'tf' | 'fill' | 'essay';

export type AnswerStatus = 'not-visited' | 'unanswered' | 'answered' | 'marked-for-review';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[]; // For mcq, mrx
  correctAnswer?: string | string[]; // Single string for mcq/tf/fill, array for mrx. Omit for essay.
  points: number;
  subject?: string;
  difficulty?: string;
}

export type CandidateAnswers = Record<string, string | string[]>;

export interface ExamStatus {
  [questionId: string]: AnswerStatus;
}

export interface CandidateResult {
  score: number;
  totalPoints: number;
  percentage: number;
  timeSpent: number; // in seconds
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  mcqBreakdown: Record<string, boolean>; // id to correct/incorrect
}

export interface CandidateInfo {
  name: string;
  id: string;
  examTitle: string;
  subject: string;
}
