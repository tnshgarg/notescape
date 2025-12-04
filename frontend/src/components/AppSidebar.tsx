import { useState } from 'react';
import { Search, Plus, Settings, ChevronRight, ChevronDown, Folder, FileText } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { mockFileSystem } from '../lib/files';
import type { FileNode } from '../lib/files';
import { useUser } from '@clerk/clerk-react';

interface AppSidebarProps {
  onFileSelect: (file: FileNode) => void;
  selectedFileId?: string;
}

const FileTreeItem = ({ node, level = 0, onSelect, selectedId }: { node: FileNode, level?: number, onSelect: (file: FileNode) => void, selectedId?: string }) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.id === selectedId;

  return (
    <div>
      <div 
        className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
          isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => {
          if (hasChildren) {
            setIsOpen(!isOpen);
          } else {
            onSelect(node);
          }
        }}
      >
        {hasChildren && (
          <span className="text-muted-foreground">
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </span>
        )}
        {!hasChildren && <span className="w-4" />}
        
        {node.type === 'folder' ? (
          <Folder className="w-4 h-4 text-blue-500" />
        ) : (
          <FileText className="w-4 h-4 text-muted-foreground" />
        )}
        
        <span className="text-sm truncate">{node.name}</span>
      </div>
      
      {isOpen && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <FileTreeItem 
              key={child.id} 
              node={child} 
              level={level + 1} 
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const AppSidebar = ({ onFileSelect, selectedFileId }: AppSidebarProps) => {
  const { user } = useUser();

  return (
    <div className="h-full flex flex-col bg-background border-r">
      {/* Header */}
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
            N
          </div>
          <div>
            <h2 className="font-semibold text-sm">Notescape</h2>
            <p className="text-xs text-muted-foreground">Astrophysics</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search files..." className="pl-8 h-9" />
          </div>
          <Button size="icon" variant="outline" className="h-9 w-9">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* File Tree */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {mockFileSystem.map((node) => (
            <FileTreeItem 
              key={node.id} 
              node={node} 
              onSelect={onFileSelect}
              selectedId={selectedFileId}
            />
          ))}
        </div>
      </ScrollArea>

      <Separator />

      {/* User Profile */}
      <div className="p-4">
        <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.imageUrl} />
            <AvatarFallback>{user?.firstName?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.fullName || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.primaryEmailAddress?.emailAddress || 'user@notescape.ai'}
            </p>
          </div>
          <a 
            href="/settings" 
            className="p-2 hover:bg-accent rounded-md transition-colors"
            title="Settings"
          >
            <Settings className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default AppSidebar;
