import { Folder, FileText, Book } from 'lucide-react';

export interface FileNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  children?: FileNode[];
  icon?: any;
}

export const mockFileSystem: FileNode[] = [
  {
    id: '1',
    name: 'Quantum Mechanics',
    type: 'folder',
    children: [
      { id: '1-1', name: 'Wave-Particle Duality', type: 'file' },
      { id: '1-2', name: 'Quantum Entanglement', type: 'file' },
    ]
  },
  {
    id: '2',
    name: 'Cosmology',
    type: 'folder',
    children: [
      { id: '2-1', name: 'Big Bang Theory', type: 'file' },
      { id: '2-2', name: 'Dark Matter', type: 'file' },
    ]
  },
  {
    id: '3',
    name: 'General Relativity',
    type: 'folder',
    children: [
      { id: '3-1', name: 'University Physics...', type: 'file' },
      { id: '3-2', name: 'Spacetime Curvature', type: 'file' },
    ]
  }
];

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * Upload file to backend (GridFS) and get extracted text
 */
export const uploadFile = async (file: File): Promise<{ fileId: string; text: string; pageCount: number }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload file');
  }

  const data = await response.json();
  return { fileId: data.fileId, text: data.text, pageCount: data.pageCount };
};

/**
 * Extract text from a PDF file (Legacy, use uploadFile instead)
 */
export const extractPdfText = async (file: File): Promise<{ text: string; pageCount: number; pdfData: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/files/extract-pdf`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to extract PDF text');
  }

  const data = await response.json();
  return { text: data.text, pageCount: data.pageCount, pdfData: data.pdfData };
};

/**
 * Read a text file and return its contents
 */
export const readTextFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

export const getFileIcon = (type: 'folder' | 'file', name?: string) => {
  if (type === 'folder') return Folder;
  if (name?.toLowerCase().includes('book') || name?.toLowerCase().includes('physics')) return Book;
  return FileText;
};
