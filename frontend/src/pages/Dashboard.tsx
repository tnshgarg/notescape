import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Plus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreateNotebookModal from '@/components/CreateNotebookModal';
import NotebookCard from '@/components/NotebookCard';
import { useNotebooks } from '@/hooks/useNotebook';

const Dashboard = () => {
  const { user } = useUser();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { notebooks, loading } = useNotebooks(user?.id || '');

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
            </h1>
            <p className="text-muted-foreground mt-1">
              {notebooks.length === 0 
                ? 'Create your first notebook to get started' 
                : `You have ${notebooks.length} notebook${notebooks.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
          
          <Button onClick={() => setShowCreateModal(true)} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Create Notebook
          </Button>
        </div>
      </header>

      {/* Notebooks Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading notebooks...</p>
        </div>
      ) : notebooks.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 rounded-lg border-2 border-dashed">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No notebooks yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first notebook by uploading your study materials, notes, or documents.
          </p>
          <Button onClick={() => setShowCreateModal(true)} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Create Your First Notebook
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {notebooks.map((notebook) => (
            <NotebookCard key={notebook._id} notebook={notebook} />
          ))}
        </div>
      )}

      {/* Create Notebook Modal */}
      <CreateNotebookModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal} 
      />
    </div>
  );
};

export default Dashboard;
