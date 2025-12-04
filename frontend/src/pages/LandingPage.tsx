
import { Button } from '@/components/ui/button';
import { BookOpen, Upload, ArrowRight, Play, CheckCircle2, Key, Zap, Infinity } from 'lucide-react';
import { SignInButton, SignUpButton, useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

const LandingPage = () => {
  const { isSignedIn } = useUser();

  // Redirect to dashboard if already signed in
  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight">NoteScape</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#showcase" className="hover:text-primary transition-colors">Showcase</a>
            <a href="#free" className="hover:text-primary transition-colors">Free</a>
          </nav>

          <div className="flex items-center gap-4">
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">Log In</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm">Sign Up</Button>
            </SignUpButton>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-24 pb-20 px-4 text-center">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Turn Any Content Into <br className="hidden md:block" />
              <span className="text-primary">Actionable Knowledge</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Notescape uses AI to generate intelligent notes from any source. Upload a file, paste a link, or start a conversation and watch your learning transform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <SignUpButton mode="modal">
                <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20">
                  Get Started Free
                </Button>
              </SignUpButton>
              <Button variant="outline" size="lg" className="h-12 px-8 text-base gap-2">
                <Play className="h-4 w-4" /> Watch Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Interactive Experience Section */}
        <section id="features" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">An Interactive Learning Experience</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                See how Notescape seamlessly transforms raw information into structured wisdom, tailored to your preferred style of thinking.
              </p>
            </div>

            {/* Mock UI Container */}
            <div className="max-w-5xl mx-auto bg-background rounded-2xl shadow-2xl border overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
                
                {/* Left Sidebar Mock */}
                <div className="md:col-span-3 border-r bg-muted/10 p-6 flex flex-col gap-6">
                  <div className="space-y-4">
                    <div className="h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-4 bg-background">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                        <Upload className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs font-medium">Upload Your Content</span>
                      <span className="text-[10px] text-muted-foreground mt-1">Drag & drop PDF</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Choose Your Mode</p>
                    <div className="space-y-2">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary text-sm font-medium flex items-center justify-between">
                        <span>Socrates</span>
                        <span className="text-[10px] opacity-70">Easily Understand</span>
                      </div>
                      <div className="p-2 rounded-lg hover:bg-muted text-muted-foreground text-sm font-medium flex items-center justify-between">
                        <span>Aristotle</span>
                        <span className="text-[10px] opacity-50">Research about Topics</span>
                      </div>
                      <div className="p-2 rounded-lg hover:bg-muted text-muted-foreground text-sm font-medium flex items-center justify-between">
                        <span>Plato</span>
                        <span className="text-[10px] opacity-50">Study for Exams</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Mock */}
                <div className="md:col-span-9 p-8 flex flex-col bg-gradient-to-br from-background to-muted/20">
                  {/* Chat/Note Interaction */}
                  <div className="space-y-6 max-w-3xl mx-auto w-full">
                    
                    {/* AI Message */}
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">AI</span>
                      </div>
                      <div className="bg-muted/50 rounded-2xl rounded-tl-none p-4 text-sm leading-relaxed">
                        <p className="font-semibold mb-1">Welcome to Socrates Mode.</p>
                        <p className="text-muted-foreground">Based on your document about Photosynthesis, what is the central question you'd like to explore first?</p>
                      </div>
                    </div>

                    {/* User Reply */}
                    <div className="flex gap-4 flex-row-reverse">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold">You</span>
                      </div>
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-none p-4 text-sm shadow-md">
                        What is the role of chlorophyll?
                      </div>
                    </div>

                    {/* AI Response */}
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">AI</span>
                      </div>
                      <div className="bg-muted/50 rounded-2xl rounded-tl-none p-4 text-sm leading-relaxed">
                        <p>Excellent question. Why do you think most plants are green? Does the color itself have a function?</p>
                      </div>
                    </div>

                    {/* Input Area */}
                    <div className="mt-8 relative">
                      <input 
                        type="text" 
                        placeholder="Ask a follow-up question..." 
                        className="w-full h-12 pl-4 pr-12 rounded-xl border bg-background shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        readOnly
                      />
                      <div className="absolute right-2 top-2 h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="showcase" className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Trusted by the Brightest Minds</h2>
              <p className="text-muted-foreground">
                See what students and researchers are saying about how Notescape has transformed their learning process.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Card 1 */}
              <div className="p-8 rounded-2xl border bg-card hover:shadow-lg transition-shadow">
                <p className="text-muted-foreground italic mb-6 leading-relaxed">
                  "Notescape's Socratic mode completely changed how I approach my research papers. It forces me to think critically and uncover insights I would have otherwise missed."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">EV</div>
                  <div>
                    <p className="font-semibold text-sm">Dr. Elena Vance</p>
                    <p className="text-xs text-muted-foreground">Postdoctoral Fellow, MIT</p>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-8 rounded-2xl border bg-card hover:shadow-lg transition-shadow">
                <p className="text-muted-foreground italic mb-6 leading-relaxed">
                  "As a PhD candidate, my reading list is endless. The Aristotle mode's logical summaries are a lifesaver. It's like having a brilliant research assistant."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">SC</div>
                  <div>
                    <p className="font-semibold text-sm">Samuel Chen</p>
                    <p className="text-xs text-muted-foreground">PhD Candidate, Stanford University</p>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-8 rounded-2xl border bg-card hover:shadow-lg transition-shadow">
                <p className="text-muted-foreground italic mb-6 leading-relaxed">
                  "The Plato mode is incredible for brainstorming. Visualizing connections between complex theories helps me structure my arguments and see the bigger picture."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">AK</div>
                  <div>
                    <p className="font-semibold text-sm">Aisha Khan</p>
                    <p className="text-xs text-muted-foreground">Masters Student, Oxford University</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
            

        {/* Free Forever / BYOK Section */}
        <section id="free" className="pb-24 pt-12 bg-background relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-10 -right-[10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -bottom-[10%] -left-[10%] w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-3xl" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-background via-muted/30 to-background border rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
                {/* "Golden Ticket" border effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                
                <div className="text-center mb-10">
                  <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-6">
                    <Infinity className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                    Completely Free. <br />
                    <span className="text-primary">Powered by You.</span>
                  </h2>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    We believe knowledge should be accessible to everyone. That's why NoteScape is open-source and free to use.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  <div className="bg-card p-6 rounded-xl border shadow-sm flex flex-col items-center text-center hover:border-primary/50 transition-colors">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                      <Key className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold mb-2">1. Get Your Key</h3>
                    <p className="text-sm text-muted-foreground">Grab a free API key from Google AI Studio. It takes 30 seconds.</p>
                  </div>

                  <div className="bg-card p-6 rounded-xl border shadow-sm flex flex-col items-center text-center hover:border-primary/50 transition-colors">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-4">
                      <Zap className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold mb-2">2. Plug It In</h3>
                    <p className="text-sm text-muted-foreground">Enter your key in NoteScape. It's stored locally on your device.</p>
                  </div>

                  <div className="bg-card p-6 rounded-xl border shadow-sm flex flex-col items-center text-center hover:border-primary/50 transition-colors">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold mb-2">3. Learn Forever</h3>
                    <p className="text-sm text-muted-foreground">Generate unlimited notes, flashcards, and quizzes. No subscriptions.</p>
                  </div>
                </div>

                <div className="text-center">
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                  >
                    Get your Gemini API Key here <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg">NoteScape</span>
          </div>
          
          <div className="flex gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>

          <p className="text-sm text-muted-foreground">
            © 2024 Notescape. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
