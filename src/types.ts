export interface Chapter {
  id: number;
  title: string;
  level: "Débutant" | "Intermédiaire" | "Avancé";
  description: string;
  lessonContent: string;
  exerciseTitle: string;
  exerciseInstruction: string;
  initialSystemPrompt: string;
  initialUserPrompt: string;
  initialPrefill: string;
  validationCheck: string;
  demoSystemPrompt: string;
  demoUserPrompt: string;
  demoPrefill: string;
}

export interface UserProgress {
  chapterId: number;
  completed: boolean;
  score: number;
  userSystemPrompt: string;
  userUserPrompt: string;
  userPrefill: string;
  feedback: string;
  actualOutput: string;
  clarityScore?: number;
  concisenessScore?: number;
  optimalVersion?: string;
  quizCompleted?: boolean;
  timedChallengeBonus?: number;
  timedChallengeSuccess?: boolean;
}
