import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Search, TrendingUp, Heart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPublicNotebooks, likeNotebook, type Notebook } from '@/lib/notebookApi';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

const categories = [
  'All',
  'Science',
  'Mathematics',
  'History',
  'Literature',
  'Programming',
  'Philosophy',
  'Other'
];

const Marketplace = () => {
  const { user } = useUser();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchNotebooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPublicNotebooks({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        search: searchQuery || undefined,
        limit: 20
      });
      setNotebooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notebooks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotebooks();
  }, [selectedCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNotebooks();
  };

  const handleLike = async (notebookId: string) => {
    if (!user?.id) return;
    
    try {
      const result = await likeNotebook(notebookId, user.id);
      setNotebooks(prev => prev.map(nb => 
        nb._id === notebookId 
          ? { ...nb, likes: result.likes }
          : nb
      ));
    } catch (err) {
      console.error('Failed to like notebook:', err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Notebook Marketplace</h1>
        <p className="text-muted-foreground">
          Discover and learn from notebooks shared by the community
        </p>
      </header>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notebooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading notebooks...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchNotebooks}>Try Again</Button>
        </div>
      ) : notebooks.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 rounded-lg border-2 border-dashed">
          <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No public notebooks yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Be the first to share your knowledge! Mark your notebooks as public to appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notebooks.map((notebook) => (
            <div 
              key={notebook._id} 
              className="group border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-shadow"
            >
              {/* Cover */}
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                {notebook.coverImage ? (
                  <img 
                    src={notebook.coverImage} 
                    alt={notebook.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-primary/40 text-4xl font-bold">
                    {notebook.title.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <Link to={`/workspace/${notebook._id}`}>
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">
                    {notebook.title}
                  </h3>
                </Link>
                
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {notebook.description || 'No description provided'}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    By {notebook.authorName || 'Anonymous'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notebook.createdAt), { addSuffix: true })}
                  </span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex gap-2">
                    {notebook.category && (
                      <Badge variant="secondary">{notebook.category}</Badge>
                    )}
                    <Badge variant="outline">
                      {notebook.sources.length} source{notebook.sources.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleLike(notebook._id)}
                  >
                    <Heart className={`h-4 w-4 ${
                      notebook.likedBy?.includes(user?.id || '') 
                        ? 'fill-red-500 text-red-500' 
                        : ''
                    }`} />
                    {notebook.likes}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
