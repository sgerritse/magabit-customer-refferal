import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSwitch } from "@/contexts/AdminSwitchContext";
import { useChallenges } from "@/hooks/useChallenges";
import { useEffect, useMemo, useState } from "react";

export const ProgressTracker = () => {
  const { isInUserMode, switchedUserId } = useAdminSwitch();
  const [logs, setLogs] = useState<{ date: Date; challengeId: number }[]>([]);
  const { getChallengeForDay } = useChallenges();

  // Fetch answer logs from database instead of localStorage
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const userId = isInUserMode && switchedUserId
          ? switchedUserId
          : (await supabase.auth.getSession()).data.session?.user?.id || null;
        if (!userId) {
          setLogs([]);
          return;
        }
        const { data, error } = await supabase
          .from('answer_logs')
          .select('created_at, challenge_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Error fetching answer logs:', error);
          setLogs([]);
          return;
        }
        setLogs((data || []).map((row: any) => ({ 
          date: new Date(row.created_at),
          challengeId: row.challenge_id 
        })));
      } catch (e) {
        console.error('Unexpected error fetching logs:', e);
        setLogs([]);
      }
    };
    fetchLogs();
  }, [isInUserMode, switchedUserId]);

  const { currentStreak, totalDays, weeklyProgress, nextAchievement } = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get start of current week (Monday)
    const currentDay = now.getDay();
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Sunday = 0, Monday = 1
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - daysFromMonday);
    
    // Sort logs by date (newest first)
    const sortedLogs = logs.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    // Calculate current streak
    let streak = 0;
    let checkDate = new Date(today);
    
    while (true) {
      const dayLogs = sortedLogs.filter(log => {
        const logDate = new Date(log.date.getFullYear(), log.date.getMonth(), log.date.getDate());
        return logDate.getTime() === checkDate.getTime();
      });
      
      if (dayLogs.length > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    // Get unique days with logs
    const uniqueDaysWithLogs = new Set(
      logs.map(log => new Date(log.date.getFullYear(), log.date.getMonth(), log.date.getDate()).getTime())
    );
    
    // Get unique completed challenges
    const completedChallenges = new Set(logs.map(log => log.challengeId));
    const totalChallengesCompleted = completedChallenges.size;
    
    // Calculate this week's progress based on challenges 1-7
    const weeklyData = Array.from({ length: 7 }, (_, index) => {
      const challengeId = index + 1;
      const completed = completedChallenges.has(challengeId);
      const isFuture = challengeId > totalChallengesCompleted + 1;
      const challenge = getChallengeForDay(index);
      
      // Find the date this challenge was completed
      const completionLog = logs.find(log => log.challengeId === challengeId);
      const completionDate = completionLog ? completionLog.date : new Date();
      
      return {
        day: `Day ${challengeId}`,
        completed,
        isFuture,
        date: completionDate,
        challenge: challenge,
        hasChallenge: !!challenge,
        challengeId
      };
    });
    
    const completedThisWeek = weeklyData.filter(d => d.completed).length;
    
    // Calculate next achievement based on completed challenges
    const nextChallengeMilestone = Math.ceil((totalChallengesCompleted + 1) / 7) * 7;
    const challengesToMilestone = nextChallengeMilestone - totalChallengesCompleted;
    
    return {
      currentStreak: totalChallengesCompleted,
      totalDays: uniqueDaysWithLogs.size,
      weeklyProgress: {
        completed: completedThisWeek,
        available: 7, // Always 7 days in a week
        days: weeklyData
      },
      nextAchievement: {
        milestone: nextChallengeMilestone,
        daysLeft: challengesToMilestone
      }
    };
  }, [logs]);

  const progressPercentage = weeklyProgress.available > 0 
    ? Math.round((weeklyProgress.completed / weeklyProgress.available) * 100) 
    : 0;

  return (
    <section>
      <Card className="card-gradient border-card-border card-glow">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="p-2 progress-gradient rounded-xl">
              <TrendingUp className="w-6 h-6 text-success-foreground" />
            </div>
            <span>Your Streak & Progress</span>
            <div className="flex items-center space-x-2 ml-auto">
              <Target className="w-5 h-5 text-success" />
              <span className="hidden sm:inline text-sm text-success font-semibold">
                {currentStreak > 0 ? "Keep it up!" : "Start today!"}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 sm:p-6 bg-success/5 rounded-2xl border border-success/20">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {/* Current Streak */}
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-success mb-2">
                  🔥 {currentStreak}
                </div>
                <div className="text-sm text-success font-semibold">Day Streak</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {currentStreak > 0 ? "Amazing!" : "Start your journey!"}
                </div>
              </div>
              
              {/* This Week Progress */}
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-success mb-2">
                  {weeklyProgress.completed}/{weeklyProgress.available}
                </div>
                <div className="text-sm text-success font-semibold">This Week</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {weeklyProgress.completed === weeklyProgress.available && weeklyProgress.available > 0
                    ? "Perfect week!" 
                    : weeklyProgress.completed > 0 
                    ? "Great progress!" 
                    : "Let's start!"}
                </div>
              </div>
              
              {/* Total Days */}
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-success mb-2">{totalDays}</div>
                <div className="text-sm text-success font-semibold">Total Days</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {totalDays > 10 ? "Incredible!" : totalDays > 0 ? "Growing!" : "Just beginning!"}
                </div>
              </div>
            </div>
            
            {/* Weekly Progress Bar */}
            <div className="mt-6 sm:mt-8">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0 items-start sm:items-center mb-3">
                <span className="text-sm font-semibold">This Week's Progress</span>
                <span className="text-sm text-success font-semibold">{progressPercentage}% Complete</span>
              </div>
              <div 
                className="w-full rounded-full h-3"
                style={{ backgroundColor: 'hsl(var(--dashboard-progress-bar-bg))' }}
              >
                <div 
                  className="h-3 rounded-full transition-smooth" 
                  style={{
                    width: `${progressPercentage}%`,
                    backgroundColor: 'hsl(var(--dashboard-progress-bar-fill))'
                  }}
                ></div>
              </div>
              <div className="grid grid-cols-7 gap-1 sm:flex sm:justify-between mt-2">
                {weeklyProgress.days.map((dayInfo, index) => (
                  <div
                    key={dayInfo.challengeId}
                    className={`text-center ${
                      dayInfo.isFuture ? 'opacity-50' : ''
                    }`}
                    title={dayInfo.challenge ? `Challenge ${dayInfo.challengeId}: ${dayInfo.challenge.title.substring(0, 50)}...` : `Challenge ${dayInfo.challengeId}`}
                  >
                    <div className="text-xs font-semibold mb-1 text-muted-foreground">
                      Day {dayInfo.challengeId}
                    </div>
                    <span className="text-2xl">
                      {dayInfo.completed ? "✅" : dayInfo.isFuture ? "⏳" : "⭐"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Achievement Preview */}
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-accent/10 rounded-xl border border-accent/20">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🏆</div>
                <div>
                  <div className="font-semibold text-accent">Next Achievement</div>
                  <div className="text-sm text-accent/80">
                    {nextAchievement.daysLeft > 0 
                      ? `${nextAchievement.milestone}-Day Streak - ${nextAchievement.daysLeft} day${nextAchievement.daysLeft > 1 ? 's' : ''} to go!`
                      : `Congratulations on your ${currentStreak}-day streak!`
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};