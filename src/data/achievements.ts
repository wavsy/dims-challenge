import type { Achievement } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-blood', title: 'First Blood', description: 'Complete your first challenge.', icon: 'flag', target: 1, measure: (s) => s.uniqueCompleted },
  { id: 'ice-breaker', title: 'Ice Breaker', description: 'Complete 5 challenges.', icon: 'snowflake', target: 5, measure: (s) => s.uniqueCompleted },
  { id: 'social-warrior', title: 'Social Warrior', description: 'Complete 15 unique challenges.', icon: 'swords', target: 15, measure: (s) => s.uniqueCompleted },
  { id: 'fearless-explorer', title: 'Fearless Explorer', description: 'Complete all 30 unique challenges.', icon: 'compass', target: 30, measure: (s) => s.uniqueCompleted },
  { id: 'consistency-king', title: 'Consistency King', description: 'Reach a 7-day streak.', icon: 'flame', target: 7, measure: (s) => s.longestStreak },
  { id: 'unstoppable', title: 'Unstoppable', description: 'Reach a 30-day streak.', icon: 'zap', target: 30, measure: (s) => s.longestStreak },
  { id: 'rejection-proof', title: 'Rejection Proof', description: 'Complete 3 rejection-related challenges.', icon: 'shield', target: 3, measure: (s) => s.byCategory['Rejection Resilience'].done },
  { id: 'spotlight-survivor', title: 'Spotlight Survivor', description: 'Complete 3 public-expression challenges.', icon: 'mic', target: 3, measure: (s) => s.byCategory['Public Confidence'].done },
  { id: 'human-connector', title: 'Human Connector', description: 'Complete 5 conversation-related challenges.', icon: 'users', target: 5, measure: (s) => s.byCategory['Conversation'].done },
  { id: 'courage-master', title: 'Courage Master', description: 'Reach level 10.', icon: 'crown', target: 10, measure: (s) => s.level.level },
];
