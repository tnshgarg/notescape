const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Chapter interface for sections extracted from sources
export interface Chapter {
  _id?: string;
  title: string;
  startPage?: number;
  endPage?: number;
  content: string;
  order: number;
  wordCount?: number;
  sourceId?: string; // Added client-side for tracking
  generatedNotes?: GeneratedNotes;
}

export interface Source {
  _id?: string;
  filename: string;
  type: 'pdf' | 'text' | 'markdown' | 'url' | 'youtube';
  content?: string;
  pdfData?: string; // Base64-encoded PDF for rendering
  url?: string;
  uploadedAt?: Date;
  size?: number;
  pageCount?: number;
  chapters?: Chapter[]; // Extracted chapters
  isChunked?: boolean;
}

export interface GeneratedNotes {
  socrates: string;
  aristotle: string;
  plato: string;
}

export interface Notebook {
  _id: string;
  userId: string;
  authorName?: string;
  title: string;
  description?: string;
  sources: Source[];
  notes: string[];
  generatedNotes: GeneratedNotes;
  isPublic: boolean;
  likes: number;
  likedBy?: string[];
  category?: string;
  coverImage?: string;
  lastAccessed: Date;
  createdAt: Date;
}

export interface CreateNotebookData {
  userId: string;
  authorName?: string;
  title: string;
  description?: string;
  sources?: Source[];
  category?: string;
}

// Get all notebooks for a user
export const getNotebooks = async (userId: string): Promise<Notebook[]> => {
  const response = await fetch(`${API_BASE_URL}/api/notebooks?userId=${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch notebooks');
  }
  
  const data = await response.json();
  return data.notebooks;
};

// Get a specific notebook by ID
export const getNotebook = async (notebookId: string): Promise<Notebook> => {
  const response = await fetch(`${API_BASE_URL}/api/notebooks/${notebookId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch notebook');
  }
  
  const data = await response.json();
  return data.notebook;
};

// Create a new notebook
export const createNotebook = async (notebookData: CreateNotebookData): Promise<Notebook> => {
  const response = await fetch(`${API_BASE_URL}/api/notebooks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(notebookData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create notebook');
  }
  
  const data = await response.json();
  return data.notebook;
};

// Update a notebook
export const updateNotebook = async (
  notebookId: string,
  updates: Partial<Notebook>
): Promise<Notebook> => {
  const response = await fetch(`${API_BASE_URL}/api/notebooks/${notebookId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update notebook');
  }
  
  const data = await response.json();
  return data.notebook;
};

// Delete a notebook
export const deleteNotebook = async (notebookId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/notebooks/${notebookId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete notebook');
  }
};

// Add a source to a notebook
export const addSource = async (
  notebookId: string,
  source: Source
): Promise<Notebook> => {
  const response = await fetch(`${API_BASE_URL}/api/notebooks/${notebookId}/sources`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(source),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add source');
  }
  
  const data = await response.json();
  return data.notebook;
};

// Remove a source from a notebook
export const removeSource = async (
  notebookId: string,
  sourceId: string
): Promise<Notebook> => {
  const response = await fetch(`${API_BASE_URL}/api/notebooks/${notebookId}/sources/${sourceId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to remove source');
  }
  
  const data = await response.json();
  return data.notebook;
};

// Get all public notebooks (for Marketplace)
export const getPublicNotebooks = async (options?: {
  category?: string;
  search?: string;
  limit?: number;
}): Promise<Notebook[]> => {
  const params = new URLSearchParams();
  if (options?.category) params.append('category', options.category);
  if (options?.search) params.append('search', options.search);
  if (options?.limit) params.append('limit', options.limit.toString());
  
  const response = await fetch(`${API_BASE_URL}/api/notebooks/public/all?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch public notebooks');
  }
  
  const data = await response.json();
  return data.notebooks;
};

// Like/Unlike a notebook
export const likeNotebook = async (
  notebookId: string,
  userId: string
): Promise<{ likes: number; liked: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/api/notebooks/${notebookId}/like`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to toggle like');
  }
  
  const data = await response.json();
  return { likes: data.likes, liked: data.liked };
};

// Save generated notes for a mode
export const saveGeneratedNotes = async (
  notebookId: string,
  mode: 'socrates' | 'aristotle' | 'plato',
  content: string,
  chapterId?: string
): Promise<Notebook> => {
  const response = await fetch(`${API_BASE_URL}/api/notebooks/${notebookId}/notes`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mode, content, chapterId }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to save generated notes');
  }
  
  const data = await response.json();
  return data.notebook;
};

// Process chapters for a source (with AI analysis if apiKey provided)
export const processChapters = async (
  notebookId: string,
  sourceId: string,
  apiKey?: string
): Promise<{ 
  success: boolean; 
  chaptersCount: number; 
  chapters: Chapter[]; 
  notebook: Notebook 
}> => {
  const response = await fetch(`${API_BASE_URL}/api/notebooks/${notebookId}/sources/${sourceId}/process-chapters`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ apiKey }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to process chapters');
  }
  
  return response.json();
};

// AI-powered chapter analysis
export const analyzeChapters = async (
  content: string,
  pageCount: number,
  apiKey: string
): Promise<{
  success: boolean;
  chapters: Array<{
    title: string;
    startPage: number;
    endPage: number;
    relevanceScore: number;
    order: number;
  }>;
  totalIdentified: number;
  relevantCount: number;
}> => {
  const response = await fetch(`${API_BASE_URL}/api/ai/analyze-chapters`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, pageCount, apiKey }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze chapters');
  }
  
  return response.json();
};
