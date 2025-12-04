import { Outlet, Link, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { LayoutDashboard, Library, Store, BookOpen, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const NavItem = ({ to, icon: Icon, children }: { to: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to === '/dashboard' && location.pathname === '/dashboard');

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
};

const Layout = () => {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-60 border-r bg-muted/30 flex flex-col hidden md:flex">
        {/* Logo */}
        <div className="h-14 flex items-center gap-2 px-4 border-b">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">NoteScape</span>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          <NavItem to="/dashboard" icon={LayoutDashboard}>Dashboard</NavItem>
          <NavItem to="/library" icon={Library}>My Library</NavItem>
          <NavItem to="/marketplace" icon={Store}>Marketplace</NavItem>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="w-full py-2 px-3 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8"
                    }
                  }}
                />
                <span className="text-sm font-medium">My Account</span>
              </div>
              <Link 
                to="/settings" 
                className="p-2 rounded-md hover:bg-muted transition-colors"
                title="Settings"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          </SignedIn>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
