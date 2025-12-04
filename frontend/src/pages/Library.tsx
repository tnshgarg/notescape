import { useUser } from '@clerk/clerk-react';
import NotebookCard from '@/components/NotebookCard';
import { useNotebooks } from '@/hooks/useNotebook';

const Library = () => {
  const { user } = useUser();
  const { notebooks, loading } = useNotebooks(user?.id || '');

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Library</h1>
        <p className="text-muted-foreground">
          All your notebooks in one place
        </p>
      </header>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading notebooks...</p>
        </div>
      ) : notebooks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No notebooks yet. Create one from the Dashboard.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notebooks.map((notebook) => (
            <NotebookCard key={notebook._id} notebook={notebook} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;
