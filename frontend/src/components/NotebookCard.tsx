import { Link } from 'react-router-dom';
import { Clock, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Notebook } from '@/lib/notebookApi';

interface NotebookCardProps {
  notebook: Notebook;
}

const NotebookCard = ({ notebook }: NotebookCardProps) => {
  const lastAccessedText = formatDistanceToNow(new Date(notebook.lastAccessed), {
    addSuffix: true
  });

  return (
    <Link
      to={`/workspace/${notebook._id}`}
      className="group block rounded-lg border bg-card p-6 transition-all hover:shadow-lg hover:border-primary"
    >
      {/* Cover Image or Placeholder */}
      <div className="aspect-video rounded-md bg-gradient-to-br from-primary/20 to-primary/5 mb-4 flex items-center justify-center">
        {notebook.coverImage ? (
          <img
            src={notebook.coverImage}
            alt={notebook.title}
            className="w-full h-full object-cover rounded-md"
          />
        ) : (
          <FileText className="h-12 w-12 text-primary/40" />
        )}
      </div>

      {/* Title and Description */}
      <div className="space-y-2">
        <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
          {notebook.title}
        </h3>
        
        {notebook.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notebook.description}
          </p>
        )}
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          <span>{notebook.sources.length} source{notebook.sources.length !== 1 ? 's' : ''}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{lastAccessedText}</span>
        </div>
      </div>
    </Link>
  );
};

export default NotebookCard;
