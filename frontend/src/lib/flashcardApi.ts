const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export interface Flashcard {
  _id: string;
  userId: string;
  notebookId: string;
  front: string;
  back: string;
  topic?: string;
  tags?: string[];
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
  timesReviewed: number;
  timesCorrect: number;
  lastReviewedAt?: Date;
}

export interface FlashcardStats {
  total: number;
  due: number;
  mastered: number;
  averageEaseFactor: number;
}

// Get user's flashcards
export const getFlashcards = async (
  userId: string,
  options?: { notebookId?: string; dueOnly?: boolean }
): Promise<Flashcard[]> => {
  const params = new URLSearchParams();
  if (options?.notebookId) params.append('notebookId', options.notebookId);
  if (options?.dueOnly) params.append('dueOnly', 'true');

  const response = await fetch(`${API_BASE_URL}/api/flashcards/${userId}?${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch flashcards');
  }

  const data = await response.json();
  return data.flashcards;
};

// Get flashcards due for review
export const getDueFlashcards = async (
  userId: string,
  limit: number = 20
): Promise<{ flashcards: Flashcard[]; count: number }> => {
  const response = await fetch(`${API_BASE_URL}/api/flashcards/${userId}/due?limit=${limit}`);

  if (!response.ok) {
    throw new Error('Failed to fetch due flashcards');
  }

  return response.json();
};

// Generate flashcards from a notebook
export const generateFlashcards = async (
  notebookId: string,
  userId: string,
  apiKey?: string
): Promise<{ flashcards: Flashcard[]; count: number }> => {
  const response = await fetch(`${API_BASE_URL}/api/flashcards/generate/${notebookId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, apiKey }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate flashcards');
  }

  return response.json();
};

// Review a flashcard (SM-2 algorithm)
export const reviewFlashcard = async (
  cardId: string,
  quality: number, // 0-5 (0-2 = incorrect, 3-5 = correct)
  userId?: string
): Promise<{ flashcard: Flashcard; nextReview: Date }> => {
  const response = await fetch(`${API_BASE_URL}/api/flashcards/${cardId}/review`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ quality, userId }),
  });

  if (!response.ok) {
    throw new Error('Failed to review flashcard');
  }

  return response.json();
};

// Delete a flashcard
export const deleteFlashcard = async (cardId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/flashcards/${cardId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete flashcard');
  }
};

// Get flashcard stats for a notebook
export const getFlashcardStats = async (
  notebookId: string,
  userId: string
): Promise<FlashcardStats> => {
  const response = await fetch(`${API_BASE_URL}/api/flashcards/stats/${notebookId}?userId=${userId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch flashcard stats');
  }

  const data = await response.json();
  return data.stats;
};
