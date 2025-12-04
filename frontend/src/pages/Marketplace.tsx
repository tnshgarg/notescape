import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { Search, TrendingUp, Heart, Clock, FileText, User, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPublicNotebooks, likeNotebook, type Notebook } from '@/lib/notebookApi';
import { formatDistanceToNow } from 'date-fns';

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

type SortOption = 'popular' | 'recent';

const Marketplace = () => {
  const { user } = useUser();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  const fetchNotebooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPublicNotebooks({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        search: searchQuery || undefined,
        sortBy,
        limit: 50
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
  }, [selectedCategory, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNotebooks();
  };

  const handleLike = async (notebookId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user?.id) return;
    
    try {
      const result = await likeNotebook(notebookId, user.id);
      setNotebooks(prev => prev.map(nb => 
        nb._id === notebookId 
          ? { ...nb, likes: result.likes, likedBy: result.liked ? [...(nb.likedBy || []), user.id] : (nb.likedBy || []).filter(id => id !== user.id) }
          : nb
      ));
    } catch (err) {
      console.error('Failed to like notebook:', err);
    }
  };

  const getSourceIcon = (sources: { type: string }[]) => {
    const types = sources.map(s => s.type);
    if (types.includes('pdf')) return 'text-red-500';
    if (types.includes('youtube')) return 'text-red-600';
    if (types.includes('url')) return 'text-green-500';
    return 'text-blue-500';
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Marketplace</h1>
        <p className="text-sm text-muted-foreground">
          Discover and learn from notebooks shared by the community
        </p>
      </header>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notebooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button type="submit" size="sm">Search</Button>
        </form>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Categories */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-1.5 border-l pl-4">
            <span className="text-xs text-muted-foreground">Sort:</span>
            <Button
              variant={sortBy === 'popular' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setSortBy('popular')}
            >
              <TrendingUp className="h-3 w-3" />
              Popular
            </Button>
            <Button
              variant={sortBy === 'recent' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setSortBy('recent')}
            >
              <Clock className="h-3 w-3" />
              Recent
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-4">Loading notebooks...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchNotebooks} variant="outline" size="sm">Try Again</Button>
        </div>
      ) : notebooks.length === 0 ? (
        <div className="text-center py-20 border rounded-lg bg-muted/10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">No public notebooks yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Be the first to share your knowledge! Mark your notebooks as public to appear here.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          {/* Table */}
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">Author</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">Sources</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">Created</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">Likes</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {notebooks.map((notebook) => (
                <tr key={notebook._id} className="group hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/shared/${notebook._id}`} className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center bg-muted ${getSourceIcon(notebook.sources)}`}>
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate group-hover:text-primary transition-colors">
                            {notebook.title}
                          </p>
                          {notebook.category && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                              {notebook.category}
                            </Badge>
                          )}
                        </div>
                        {notebook.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-md">
                            {notebook.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <User className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{notebook.authorName || 'Anonymous'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {notebook.sources.length} source{notebook.sources.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(notebook.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 gap-1"
                        onClick={(e) => handleLike(notebook._id, e)}
                        disabled={!user}
                      >
                        <Heart className={`h-3.5 w-3.5 ${
                          notebook.likedBy?.includes(user?.id || '') 
                            ? 'fill-red-500 text-red-500' 
                            : ''
                        }`} />
                        <span className="text-xs">{notebook.likes}</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
