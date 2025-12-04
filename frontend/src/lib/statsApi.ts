const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export interface UserStats {
  _id: string;
  userId: string;
  totalXP: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: Date;
  topicsLearned: number;
  flashcardsStudied: number;
  totalStudyMinutes: number;
  weeklyTopics: number;
  weeklyFlashcards: number;
  weeklyXP: number;
  activityHistory: {
    date: Date;
    type: string;
    xpEarned: number;
  }[];
  achievements: {
    id: string;
    name: string;
    description?: string;
    unlockedAt: Date;
    icon?: string;
  }[];
}

export interface ActivityData {
  date: string;
  count: number;
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: 'notebook' | 'topic';
  hasNotes?: boolean;
}

export interface KnowledgeGraphEdge {
  source: string;
  target: string;
  type: string;
}

// Get user stats
export const getUserStats = async (userId: string): Promise<UserStats> => {
  const response = await fetch(`${API_BASE_URL}/api/stats/${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch user stats');
  }
  
  const data = await response.json();
  return data.stats;
};

// Log activity and earn XP
export const logActivity = async (
  userId: string,
  type: 'notebook_created' | 'notes_generated' | 'flashcard_studied' | 'source_added',
  notebookId?: string,
  xpAmount?: number
): Promise<{ stats: UserStats; xpEarned: number; newLevel: number }> => {
  const response = await fetch(`${API_BASE_URL}/api/stats/${userId}/activity`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type, notebookId, xpAmount }),
  });

  if (!response.ok) {
    throw new Error('Failed to log activity');
  }

  return response.json();
};

// Get activity calendar data
export const getActivityCalendar = async (
  userId: string,
  weeks: number = 12
): Promise<ActivityData[]> => {
  const response = await fetch(`${API_BASE_URL}/api/stats/${userId}/activity-calendar?weeks=${weeks}`);

  if (!response.ok) {
    throw new Error('Failed to fetch activity calendar');
  }

  const data = await response.json();
  return data.activityData;
};

// Get knowledge graph data
export const getKnowledgeGraph = async (
  userId: string
): Promise<{ nodes: KnowledgeGraphNode[]; edges: KnowledgeGraphEdge[] }> => {
  const response = await fetch(`${API_BASE_URL}/api/stats/${userId}/knowledge-graph`);

  if (!response.ok) {
    throw new Error('Failed to fetch knowledge graph');
  }

  return response.json();
};
