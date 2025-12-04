import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Upload, FileText, X, Loader2, AlertCircle } from 'lucide-react';
import { createNotebook, type Source } from '@/lib/notebookApi';
import { uploadFile, readTextFile } from '@/lib/files';

interface CreateNotebookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateNotebookModal = ({ open, onOpenChange }: CreateNotebookModalProps) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      // Track uploading state
      setUploadingFiles(prev => [...prev, file.name]);
      setError(null);

      try {
        let content = '';
        let pageCount: number | undefined;
        let fileId: string | undefined;
        let pdfData: string | undefined;

        if (file.name.endsWith('.pdf')) {
          // Upload to GridFS and get text
          const result = await uploadFile(file);
          content = result.text;
          pageCount = result.pageCount;
          fileId = result.fileId;
          
          if (!content || content.trim().length === 0) {
            throw new Error('Could not extract text from PDF. The PDF might be image-based or encrypted.');
          }
        } else {
          // Read text files directly
          content = await readTextFile(file);
        }

        const newSource: Source = {
          filename: file.name,
          type: file.name.endsWith('.pdf') ? 'pdf' : 
                file.name.endsWith('.md') ? 'markdown' : 'text',
          content,
          fileId, // Reference to GridFS file
          pdfData, // Legacy support
          size: file.size,
          pageCount,
          uploadedAt: new Date()
        };

        setSources(prev => [...prev, newSource]);
      } catch (err) {
        setError(`Failed to process ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setUploadingFiles(prev => prev.filter(name => name !== file.name));
      }
    }

    // Reset the input
    e.target.value = '';
  };

  const handlePastedTextAdd = () => {
    if (!pastedText.trim()) return;

    const newSource: Source = {
      filename: `Pasted Text ${sources.length + 1}`,
      type: 'text',
      content: pastedText,
      size: pastedText.length,
      uploadedAt: new Date()
    };

    setSources(prev => [...prev, newSource]);
    setPastedText('');
  };

  const removeSource = (index: number) => {
    setSources(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!user?.id) {
      setError('You must be logged in to create a notebook');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a notebook title');
      return;
    }

    if (sources.length === 0) {
      setError('Please add at least one source');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const notebook = await createNotebook({
        userId: user.id,
        authorName: user.fullName || undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        sources
      });

      // Reset form
      setTitle('');
      setDescription('');
      setSources([]);
      setPastedText('');
      onOpenChange(false);

      // Navigate to the new notebook's workspace
      navigate(`/workspace/${notebook._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create notebook');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Notebook</DialogTitle>
          <DialogDescription>
            Add sources to your notebook. Supported types: PDF, Text, Markdown
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Notebook Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Quantum Mechanics Study Guide"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="What is this notebook about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload Sources</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
              <input
                type="file"
                id="file-upload"
                multiple
                accept=".pdf,.txt,.md"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploadingFiles.length > 0}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {uploadingFiles.length > 0 ? (
                  <>
                    <Loader2 className="h-8 w-8 mx-auto mb-2 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">
                      Processing {uploadingFiles[0]}...
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Drag & drop files or <span className="text-primary">browse</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supported: PDF (text will be extracted), TXT, Markdown
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Paste Text */}
          <div className="space-y-2">
            <Label htmlFor="paste-text">Or Paste Text</Label>
            <Textarea
              id="paste-text"
              placeholder="Paste your content here..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              rows={4}
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handlePastedTextAdd}
              disabled={!pastedText.trim()}
            >
              Add Pasted Text
            </Button>
          </div>

          {/* Sources List */}
          {sources.length > 0 && (
            <div className="space-y-2">
              <Label>Sources ({sources.length}/50)</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {sources.map((source, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-md"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm truncate block">{source.filename}</span>
                        <span className="text-xs text-muted-foreground">
                          {source.type.toUpperCase()}
                          {source.size && ` • ${formatFileSize(source.size)}`}
                          {source.pageCount && ` • ${source.pageCount} pages`}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => removeSource(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading || sources.length === 0 || uploadingFiles.length > 0}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Notebook'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNotebookModal;
