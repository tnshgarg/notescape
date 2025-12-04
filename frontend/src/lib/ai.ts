const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export interface GenerateNotesParams {
  content: string;
  mode: 'socrates' | 'aristotle' | 'plato';
  apiKey: string;
}

export interface GenerateNotesResponse {
  success: boolean;
  notes: string;
  mode: string;
}

export interface ChatParams {
  message: string;
  context?: string;
  apiKey: string;
}

export interface ChatResponse {
  success: boolean;
  reply: string;
}

// Error types for better handling
export class AIError extends Error {
  code: string;
  isQuotaError: boolean;
  isAuthError: boolean;
  
  constructor(message: string, code: string = 'UNKNOWN_ERROR') {
    super(message);
    this.name = 'AIError';
    this.code = code;
    this.isQuotaError = code === 'QUOTA_EXCEEDED' || message.toLowerCase().includes('quota');
    this.isAuthError = code === 'INVALID_API_KEY' || message.toLowerCase().includes('api key');
  }
}

/**
 * Parse API error response and throw appropriate error
 */
const handleAPIError = async (response: Response): Promise<never> => {
  const data = await response.json().catch(() => ({ error: 'Unknown error' }));
  const errorMessage = data.error || data.message || 'Request failed';
  
  // Detect quota errors
  if (response.status === 429 || 
      errorMessage.toLowerCase().includes('quota') ||
      errorMessage.toLowerCase().includes('rate limit') ||
      errorMessage.toLowerCase().includes('too many requests')) {
    throw new AIError(
      'API quota exceeded. Please wait a few minutes and try again, or check your usage limits in Google Cloud Console.',
      'QUOTA_EXCEEDED'
    );
  }
  
  // Detect auth errors
  if (response.status === 401 || response.status === 403 ||
      errorMessage.toLowerCase().includes('api key') ||
      errorMessage.toLowerCase().includes('unauthorized') ||
      errorMessage.toLowerCase().includes('invalid key')) {
    throw new AIError(
      'Invalid API key. Please check your Gemini API key in Settings.',
      'INVALID_API_KEY'
    );
  }
  
  // Generic error
  throw new AIError(errorMessage, 'API_ERROR');
};

/**
 * Generate notes from content using Gemini AI
 */
export const generateNotes = async (params: GenerateNotesParams): Promise<GenerateNotesResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/ai/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    await handleAPIError(response);
  }

  return response.json();
};

/**
 * Chat with AI about the notes
 */
export const chatWithAI = async (params: ChatParams): Promise<ChatResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    await handleAPIError(response);
  }

  return response.json();
};
/**
 * Validate API key by making a lightweight request
 */
export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    // Use chat endpoint for a lightweight check
    const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'ping',
        apiKey,
      }),
    });

    if (response.ok) {
      return true;
    }

    // If 401 or 403, key is definitely invalid
    if (response.status === 401 || response.status === 403) {
      return false;
    }

    // For other errors (quota, server error), we might want to assume valid or throw
    // But for validation purposes, let's check the error message
    const data = await response.json().catch(() => ({}));
    if (data.error && (data.error.includes('API key') || data.error.includes('unauthorized'))) {
      return false;
    }

    // If it's a quota error, the key is valid but exhausted
    if (data.error && (data.error.includes('quota') || data.error.includes('rate limit'))) {
      return true;
    }

    // Default to false for other unknown errors during validation
    return false;
  } catch (error) {
    console.error('API Key validation error:', error);
    return false;
  }
};
