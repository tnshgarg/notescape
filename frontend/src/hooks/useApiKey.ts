import { useState, useEffect } from 'react';

/**
 * Custom hook to manage Gemini API key in localStorage
 */
export const useApiKey = () => {
  // Initialize directly from localStorage to avoid flash of null
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    return localStorage.getItem('gemini_api_key');
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Sync with localStorage in case it changes in another tab
    const handleStorageChange = () => {
      setApiKeyState(localStorage.getItem('gemini_api_key'));
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setApiKey = (key: string) => {
    localStorage.setItem('gemini_api_key', key);
    setApiKeyState(key);
  };

  const clearApiKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKeyState(null);
  };

  const hasApiKey = (): boolean => {
    return !!apiKey;
  };

  return {
    apiKey,
    setApiKey,
    clearApiKey,
    hasApiKey,
    isLoading
  };
};
