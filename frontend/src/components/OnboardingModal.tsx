import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Sparkles, GraduationCap, Check, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { completeOnboarding, isNstEmail } from '@/lib/userApi';

interface OnboardingModalProps {
  open: boolean;
  onComplete: (isNstVerified: boolean) => void;
}

const AVAILABLE_INTERESTS = [
  'Computer Science',
  'Data Science',
  'Machine Learning',
  'Web Development',
  'Mobile Development',
  'Database Systems',
  'Operating Systems',
  'Networking',
  'Cybersecurity',
  'Cloud Computing',
  'DevOps',
  'UI/UX Design',
  'Business Analytics',
  'Mathematics',
  'Physics',
  'Other'
];

const OnboardingModal = ({ open, onComplete }: OnboardingModalProps) => {
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const email = user?.primaryEmailAddress?.emailAddress || '';
  const isNst = isNstEmail(email);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const result = await completeOnboarding({
        clerkId: user.id,
        email: email,
        username: user.username || user.firstName || undefined,
        interests: selectedInterests,
        college: isNst ? 'nst' : 'other'
      });
      
      onComplete(result.isNstVerified);
    } catch (error) {
      console.error('Onboarding failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        {/* Step 1: Welcome */}
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Welcome to NoteScape!
              </DialogTitle>
              <DialogDescription className="text-base">
                Hi {user?.firstName || 'there'}! Let's personalize your learning experience.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt="" className="w-12 h-12 rounded-full" />
                  ) : (
                    <span className="text-xl">👋</span>
                  )}
                </div>
                <div>
                  <p className="font-medium">{user?.fullName || user?.firstName || 'Student'}</p>
                  <p className="text-sm text-muted-foreground">{email}</p>
                </div>
              </div>

              {isNst && (
                <div className="mt-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-emerald-600" />
                    <p className="font-medium text-emerald-700 dark:text-emerald-400">
                      NST Student Detected!
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    You'll have access to exclusive NST learning features.
                  </p>
                </div>
              )}
            </div>

            <Button onClick={() => setStep(2)} className="w-full gap-2">
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Step 2: Interests */}
        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle>What are you interested in?</DialogTitle>
              <DialogDescription>
                Select topics you want to learn. This helps us personalize your experience.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                {AVAILABLE_INTERESTS.map(interest => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <Badge
                      key={interest}
                      variant={isSelected ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all px-3 py-1.5 text-sm ${
                        isSelected 
                          ? 'bg-primary hover:bg-primary/90' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => toggleInterest(interest)}
                    >
                      {isSelected && <Check className="h-3 w-3 mr-1" />}
                      {interest}
                    </Badge>
                  );
                })}
              </div>
              
              {selectedInterests.length > 0 && (
                <p className="text-sm text-muted-foreground mt-3">
                  {selectedInterests.length} selected
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleComplete} 
                disabled={loading}
                className="flex-1 gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
