import { useState, useEffect } from 'react';

/**
 * Custom hook to manage Gemini API key in localStorage
 */
export const useApiKey = () => {
  // Initialize directly from localStorage to avoid flash of null
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    return localStorage.getItem('gemini_api_key');
  });

  useEffect(() => {
    // Sync with localStorage in case it changes in another tab
    const handleStorageChange = () => {
      setApiKeyState(localStorage.getItem('gemini_api_key'));
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-update', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-update', handleStorageChange);
    };
  }, []);

  const setApiKey = (key: string) => {
    localStorage.setItem('gemini_api_key', key);
    setApiKeyState(key);
    window.dispatchEvent(new Event('local-storage-update'));
  };

  const clearApiKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKeyState(null);
    window.dispatchEvent(new Event('local-storage-update'));
  };

  const hasApiKey = (): boolean => {
    return !!apiKey;
  };

  return {
    apiKey,
    setApiKey,
    clearApiKey,
    hasApiKey,
  };
};
