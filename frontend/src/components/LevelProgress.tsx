interface LevelProgressProps {
  xp: number;
  level: number;
}

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 7000, 11000, 16000, 22000];

const getLevelInfo = (xp: number) => {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  
  const currentLevelXP = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextLevelXP = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const xpInLevel = xp - currentLevelXP;
  const xpForLevel = nextLevelXP - currentLevelXP;
  const progress = Math.min((xpInLevel / xpForLevel) * 100, 100);
  
  return { level, xpInLevel, xpForLevel, progress, nextLevelXP };
};

const LevelProgress = ({ xp }: LevelProgressProps) => {
  const { level, xpInLevel, xpForLevel, progress } = getLevelInfo(xp);
  
  const levelTitles = [
    'Novice Learner',
    'Curious Mind',
    'Knowledge Seeker',
    'Focused Scholar',
    'Rising Expert',
    'Master Learner',
    'Wisdom Keeper',
    'Enlightened One',
    'Grand Master',
    'Legend'
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Level Badge */}
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-500/20">
              {level}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-bold text-amber-900">
              ⭐
            </div>
          </div>
          
          <div>
            <p className="font-semibold">{levelTitles[level - 1] || 'Master'}</p>
            <p className="text-xs text-muted-foreground">Level {level}</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-sm font-medium">{xp.toLocaleString()} XP</p>
          <p className="text-xs text-muted-foreground">
            {xpForLevel - xpInLevel} to level {level + 1}
          </p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="relative">
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Milestone markers */}
        <div className="absolute inset-0 flex justify-between px-1">
          {[25, 50, 75].map((milestone) => (
            <div
              key={milestone}
              className={`w-0.5 h-full ${
                progress >= milestone ? 'bg-white/50' : 'bg-muted-foreground/20'
              }`}
              style={{ marginLeft: `${milestone}%` }}
            />
          ))}
        </div>
      </div>
      
      {/* XP breakdown hint */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span>📚 +10 XP per topic</span>
        <span>🎴 +5 XP per flashcard</span>
        <span>🔥 +20 XP streak bonus</span>
      </div>
    </div>
  );
};

export default LevelProgress;
export { getLevelInfo, LEVEL_THRESHOLDS };
