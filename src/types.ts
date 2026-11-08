export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Extreme';

export type Category =
  | 'Social Initiation'
  | 'Conversation'
  | 'Rejection Resilience'
  | 'Public Confidence'
  | 'Vulnerability'
  | 'Social Leadership';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  category: Category;
  difficulty: Difficulty;
  xp: number;
  estimatedMinutes: number;
  objective: string;
  suggestedSetting: string;
  safetyTip: string;
}

export type AttemptStatus = 'completed' | 'attempted' | 'skipped';

export type DiscomfortRating = 1 | 2 | 3 | 4 | 5;

export interface ChallengeReflection {
  discomfort?: DiscomfortRating;
  uncomfortable?: string;
  happened?: string;
  learned?: string;
  createdAt: string;
}

export interface ChallengeAttempt {
  id: string;
  challengeId: string;
  status: AttemptStatus;
  /** ISO timestamp of when the attempt was recorded */
  timestamp: string;
  /** Local calendar date (YYYY-MM-DD) the attempt was recorded on */
  dateKey: string;
  /** ISO timestamp of when the challenge was started, if known */
  startedAt?: string;
  /** XP credited for this event. 0 for skips and for repeats of an already-rewarded challenge. */
  xpAwarded: number;
  reflection?: ChallengeReflection;
}

export interface PlayerProfile {
  username: string;
  createdAt: string;
}

export type ThemePreference = 'dark' | 'light' | 'system';

export interface UserSettings {
  theme: ThemePreference;
}

export interface DailyPick {
  dateKey: string;
  challengeId: string;
  swaps: number;
}

export interface AppState {
  version: number;
  profile: PlayerProfile;
  settings: UserSettings;
  attempts: ChallengeAttempt[];
  /** challengeId -> ISO startedAt for challenges currently in progress */
  active: Record<string, string>;
  daily: DailyPick | null;
}

export interface LevelInfo {
  level: number;
  title: string;
  floor: number;
  ceil: number;
}

export interface ProgressStats {
  totalXP: number;
  level: LevelInfo;
  completedIds: Set<string>;
  uniqueCompleted: number;
  totalEvents: number;
  completedEvents: number;
  attemptedEvents: number;
  skippedEvents: number;
  currentStreak: number;
  longestStreak: number;
  activeToday: boolean;
  xpByDay: { dateKey: string; xp: number }[];
  byDifficulty: Record<Difficulty, { done: number; total: number }>;
  byCategory: Record<Category, { done: number; total: number }>;
  recent: ChallengeAttempt[];
  reflections: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  measure: (stats: ProgressStats) => number;
}

export interface UnlockedAchievement {
  achievement: Achievement;
  unlockedAt: string;
}
