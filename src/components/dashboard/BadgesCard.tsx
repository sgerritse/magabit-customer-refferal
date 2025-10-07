import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Award } from "lucide-react";
import { useChallenges } from "@/hooks/useChallenges";
import { useBadgeDefinitions } from "@/hooks/useBadgeDefinitions";

export const BadgesCard = () => {
  const { todaysChallenge } = useChallenges();
  const { badgeDefinitions } = useBadgeDefinitions();

  // Get badges that can be earned from today's challenge
  const getBadgesFor = (challenge: any) => {
    if (!challenge) return [];
    
    // Get challenge-based badges
    const challengeBadges = badgeDefinitions.filter(badge => 
      badge.trigger_type === 'challenge' && 
      badge.challenge_ids.includes(String((challenge as any).challenge_id ?? challenge.id))
    );

    // Get seasonal badges for today's date
    const today = new Date();
    const isHalloween = today.getMonth() === 9 && today.getDate() === 31;
    const isChristmas = today.getMonth() === 11 && today.getDate() === 25;
    const isNewYear = today.getMonth() === 0 && today.getDate() === 1;
    
    const seasonalBadges = badgeDefinitions.filter(badge => {
      if (badge.trigger_type !== 'action' || !badge.action_trigger) return false;
      
      return (
        (isHalloween && badge.action_trigger.type === 'seasonal_halloween') ||
        (isChristmas && badge.action_trigger.type === 'seasonal_christmas') ||
        (isNewYear && badge.action_trigger.type === 'seasonal_newyear')
      );
    });

    return [...challengeBadges, ...seasonalBadges];
  };

  const availableBadges = getBadgesFor(todaysChallenge);

  if (availableBadges.length === 0) {
    return null;
  }

  return (
    <Card 
      className="transition-all duration-300 hover:shadow-md"
      style={{
        backgroundColor: 'hsl(var(--badges-card-bg))',
        borderColor: 'hsl(var(--badges-card-border))'
      }}
    >
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          <div 
            className="p-2 rounded-xl"
            style={{ backgroundColor: 'hsl(var(--stats-icon-bg))' }}
          >
            <Award className="w-6 h-6" style={{ color: 'hsl(var(--stats-icon-color))' }} />
          </div>
          <span>Badges You Earn Completing This Challenge</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {availableBadges.map((badge) => (
            <div
              key={badge.id}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg border-2 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer"
              style={{
                backgroundColor: 'hsl(var(--badge-item-bg))',
                borderColor: 'hsl(var(--badge-item-border))'
              }}
            >
              <span className="text-lg">{badge.icon}</span>
              <div className="flex flex-col">
                <span className="text-sm font-medium" style={{ color: 'hsl(var(--badge-item-text))' }}>{badge.name}</span>
                <div className="flex items-center space-x-1">
                  <Trophy className="w-3 h-3" style={{ color: 'hsl(var(--stats-icon-color))' }} />
                  <span className="text-xs font-medium" style={{ color: 'hsl(var(--stats-icon-color))' }}>{badge.points} pts</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-black mt-3">
          Complete today's challenge to earn these badges and points!
        </p>
      </CardContent>
    </Card>
  );
};
