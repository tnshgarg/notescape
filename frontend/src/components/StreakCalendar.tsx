import { useMemo } from 'react';

interface StreakCalendarProps {
  activityData: { date: string; count: number }[];
  weeks?: number;
}

const StreakCalendar = ({ activityData, weeks = 12 }: StreakCalendarProps) => {
  const calendarData = useMemo(() => {
    const today = new Date();
    const data: { date: Date; count: number; dayOfWeek: number }[] = [];
    
    // Generate last N weeks of dates
    for (let i = weeks * 7 - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Find matching activity
      const dateStr = date.toISOString().split('T')[0];
      const activity = activityData.find(a => a.date === dateStr);
      
      data.push({
        date,
        count: activity?.count || 0,
        dayOfWeek: date.getDay()
      });
    }
    
    return data;
  }, [activityData, weeks]);

  // Calculate current streak
  const currentStreak = useMemo(() => {
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = calendarData.length - 1; i >= 0; i--) {
      const dateStr = calendarData[i].date.toISOString().split('T')[0];
      if (calendarData[i].count > 0 || dateStr === today) {
        if (calendarData[i].count > 0) streak++;
        else if (dateStr === today) continue;
        else break;
      } else {
        break;
      }
    }
    return streak;
  }, [calendarData]);

  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-muted';
    if (count <= 1) return 'bg-emerald-200 dark:bg-emerald-900';
    if (count <= 3) return 'bg-emerald-400 dark:bg-emerald-700';
    if (count <= 5) return 'bg-emerald-500 dark:bg-emerald-500';
    return 'bg-emerald-600 dark:bg-emerald-400';
  };

  // Group by weeks
  const weekData: typeof calendarData[] = [];
  for (let i = 0; i < calendarData.length; i += 7) {
    weekData.push(calendarData.slice(i, i + 7));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Activity Streak</p>
          <p className="text-xs text-muted-foreground">Last {weeks} weeks</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-emerald-500">{currentStreak}</p>
          <p className="text-xs text-muted-foreground">day streak</p>
        </div>
      </div>

      <div className="flex gap-1">
        {weekData.map((week, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-1">
            {week.map((day, dayIdx) => (
              <div
                key={dayIdx}
                className={`w-3 h-3 rounded-sm ${getColorClass(day.count)} transition-colors hover:ring-2 hover:ring-primary/50`}
                title={`${day.date.toLocaleDateString()}: ${day.count} activities`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-0.5">
          {[0, 1, 3, 5, 7].map((level) => (
            <div key={level} className={`w-3 h-3 rounded-sm ${getColorClass(level)}`} />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default StreakCalendar;
