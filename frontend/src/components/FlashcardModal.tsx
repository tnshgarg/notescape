import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, RotateCcw, Check, Brain, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface FlashcardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flashcards: Flashcard[];
  notebookTitle?: string;
  onComplete?: (results: { cardId: string; correct: boolean }[]) => void;
}

const FlashcardModal = ({ 
  open, 
  onOpenChange, 
  flashcards, 
  notebookTitle,
  onComplete 
}: FlashcardModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<{ cardId: string; correct: boolean }[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setIsFlipped(false);
      setResults([]);
      setIsComplete(false);
    }
  }, [open]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleAnswer = (correct: boolean) => {
    const newResults = [...results, { cardId: currentCard.id, correct }];
    setResults(newResults);

    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setIsComplete(true);
      onComplete?.(newResults);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setResults([]);
    setIsComplete(false);
  };

  const correctCount = results.filter(r => r.correct).length;

  if (flashcards.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-violet-500" />
              Flashcards
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No flashcards available yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Generate notes first to create flashcards.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-violet-500" />
              {notebookTitle ? `${notebookTitle} - Flashcards` : 'Study Flashcards'}
            </span>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {!isComplete ? (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Card {currentIndex + 1} of {flashcards.length}</span>
                <span>{correctCount} correct</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Flashcard */}
            <div 
              className="relative h-64 cursor-pointer perspective-1000"
              onClick={handleFlip}
            >
              <div 
                className={`
                  absolute inset-0 rounded-2xl border-2 p-8 flex items-center justify-center
                  transition-all duration-500 preserve-3d backface-hidden
                  ${isFlipped ? 'rotate-y-180' : ''}
                  ${!isFlipped 
                    ? 'bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/30' 
                    : 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30 rotate-y-180'
                  }
                `}
                style={{
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  backfaceVisibility: 'hidden'
                }}
              >
                {!isFlipped && (
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Question</p>
                    <p className="text-lg font-medium">{currentCard.front}</p>
                    <p className="text-xs text-muted-foreground mt-6">Click to reveal answer</p>
                  </div>
                )}
              </div>
              
              <div 
                className={`
                  absolute inset-0 rounded-2xl border-2 p-8 flex items-center justify-center
                  bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30
                  transition-all duration-500
                `}
                style={{
                  transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(-180deg)',
                  backfaceVisibility: 'hidden'
                }}
              >
                {isFlipped && (
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Answer</p>
                    <p className="text-lg font-medium">{currentCard.back}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              {isFlipped && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                    onClick={() => handleAnswer(false)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Wrong
                  </Button>
                  <Button
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    onClick={() => handleAnswer(true)}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Correct
                  </Button>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (currentIndex < flashcards.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                    setIsFlipped(false);
                  }
                }}
                disabled={currentIndex === flashcards.length - 1}
              >
                Skip
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        ) : (
          /* Completion Screen */
          <div className="text-center py-8 space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-emerald-500" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Session Complete!</h3>
              <p className="text-muted-foreground">
                You got {correctCount} out of {flashcards.length} correct
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-500">{correctCount}</p>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-500">{flashcards.length - correctCount}</p>
                <p className="text-xs text-muted-foreground">Incorrect</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-violet-500">
                  {Math.round((correctCount / flashcards.length) * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">Score</p>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-4">
              <Button variant="outline" onClick={handleRestart}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Study Again
              </Button>
              <Button onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FlashcardModal;
