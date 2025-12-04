import { useState, useEffect } from 'react';
import { getNotebook, getNotebooks, type Notebook } from '@/lib/notebookApi';

export const useNotebook = (notebookId?: string) => {
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotebook = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNotebook(id);
      setNotebook(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notebook');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (notebookId) {
      fetchNotebook(notebookId);
    }
  }, [notebookId]);

  const refresh = () => {
    if (notebookId) {
      fetchNotebook(notebookId);
    }
  };

  return { notebook, loading, error, refresh, setNotebook };
};

export const useNotebooks = (userId: string) => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotebooks = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await getNotebooks(userId);
      setNotebooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notebooks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotebooks();
  }, [userId]);

  const refresh = () => {
    fetchNotebooks();
  };

  return { notebooks, loading, error, refresh, setNotebooks };
};
