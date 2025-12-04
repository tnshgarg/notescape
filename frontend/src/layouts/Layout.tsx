import { Outlet } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { LayoutDashboard, Library, Store, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card p-4 hidden md:flex flex-col">
        <div className="flex items-center gap-2 mb-8 px-2">
          <BookOpen className="h-6 w-6" />
          <span className="font-bold text-xl">NoteScape</span>
        </div>
        
        <nav className="space-y-2 flex-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>
          <Link to="/library" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
            <Library className="h-5 w-5" />
            My Library
          </Link>
          <Link to="/marketplace" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
            <Store className="h-5 w-5" />
            Marketplace
          </Link>
        </nav>

        <div className="mt-auto pt-4 border-t">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center gap-3 px-2">
              <UserButton />
              <span className="text-sm font-medium">My Account</span>
            </div>
          </SignedIn>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
