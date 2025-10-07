import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lock, Trophy, Medal, Award } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const levels = [
  { level: 1, name: "Start Here", unlock: "69% of members", unlocked: true, color: "bg-yellow-500" },
  { level: 2, name: "⚙️ Survival Toolkit", unlock: "25% of members", unlocked: false, color: "bg-gray-400" },
  { level: 3, name: "⚖️ Family Law 101", unlock: "0% of members", unlocked: false, color: "bg-gray-400" },
  { level: 4, name: "", unlock: "5% of members", unlocked: false, color: "bg-gray-400" },
  { level: 5, name: "", unlock: "0% of members", unlocked: false, color: "bg-gray-400" },
  { level: 6, name: "", unlock: "0% of members", unlocked: false, color: "bg-gray-400" },
  { level: 7, name: "", unlock: "0% of members", unlocked: false, color: "bg-gray-400" },
  { level: 8, name: "", unlock: "0% of members", unlocked: false, color: "bg-gray-400" },
  { level: 9, name: "", unlock: "0% of members", unlocked: false, color: "bg-gray-400" },
];

const leaderboardData = {
  "7-day": [],
  "30-day": [
    { rank: 1, name: "Max Shippee", points: 7, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" },
    { rank: 2, name: "Fox Hareld", points: 4, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face" },
    { rank: 3, name: "Michael Smith", points: 2, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" },
  ],
  "all-time": [
    { rank: 1, name: "Nick Davis", points: 9, avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=100&h=100&fit=crop&crop=face" },
    { rank: 2, name: "Max Shippee", points: 7, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" },
    { rank: 3, name: "Michael Smith", points: 7, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" },
    { rank: 4, name: "Fox Hareld", points: 5, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face" },
    { rank: 5, name: "James Payne", points: 1, avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face" },
  ]
};

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
    case 2: return <Medal className="w-5 h-5 text-gray-400" />;
    case 3: return <Award className="w-5 h-5 text-amber-600" />;
    default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
  }
};

export const LeaderboardTab = () => {
  const { user } = useAuth();
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [visibleBadges, setVisibleBadges] = useState<any[]>([]);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      if (!user) return;

      try {
        // Fetch user's badges
        const { data: badges, error } = await supabase
          .from('user_badges')
          .select('*')
          .eq('user_id', user.id)
          .order('earned_at', { ascending: false });

        if (error) throw error;

        setUserBadges(badges || []);

        // Get unique badge definitions
        const uniqueBadges = badges?.reduce((acc: any[], badge: any) => {
          const existing = acc.find(b => b.badge_id === badge.badge_id);
          if (!existing) {
            acc.push({
              badge_id: badge.badge_id,
              badge_name: badge.badge_name,
              badge_description: badge.badge_description,
              badge_icon: badge.badge_icon,
              earned: true,
              earned_at: badge.earned_at
            });
          }
          return acc;
        }, []) || [];

        // Add some example badges that user hasn't earned yet
        const sampleBadges = [
          { badge_id: 'first_steps', badge_name: 'First Steps', badge_description: 'Complete your first challenge', badge_icon: '🚀', earned: false },
          { badge_id: 'consistent', badge_name: 'Consistent Dad', badge_description: 'Complete challenges 7 days in a row', badge_icon: '⚡', earned: false },
          { badge_id: 'social', badge_name: 'Social Butterfly', badge_description: 'Share 5 public responses', badge_icon: '🦋', earned: false },
          { badge_id: 'mentor', badge_name: 'Mentor', badge_description: 'Help other dads in the community', badge_icon: '👨‍🏫', earned: false },
          { badge_id: 'achiever', badge_name: 'High Achiever', badge_description: 'Earn 100 points in a month', badge_icon: '🏆', earned: false },
          { badge_id: 'storyteller', badge_name: 'Storyteller', badge_description: 'Share 10 detailed responses', badge_icon: '📖', earned: false },
        ];

        const allBadgesList = [...uniqueBadges, ...sampleBadges.filter(sample => 
          !uniqueBadges.some(earned => earned.badge_id === sample.badge_id)
        )];

        setAllBadges(allBadgesList);
        setVisibleBadges(allBadgesList.slice(0, 9));
      } catch (error) {
        console.error('Error fetching badges:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [user]);

  const handleLoadMore = () => {
    setShowAllBadges(true);
    setVisibleBadges(allBadges);
  };
  return (
    <div className="space-y-6">
      {/* User Profile Section */}
      <Card className="border-accent/20">
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face" />
              <AvatarFallback>SG</AvatarFallback>
            </Avatar>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                1
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold">Steven Gerritse</h3>
              <Badge variant="secondary" className="mb-2">Level 1</Badge>
              <p className="text-sm text-muted-foreground">5 points to level up</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges Section */}
      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle>Badges & Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading badges...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {visibleBadges.map((badge) => (
                  <div key={badge.badge_id} className={`flex flex-col items-center p-3 rounded-lg transition-colors relative ${
                    badge.earned ? 'bg-accent/10 border border-accent/20' : 'bg-muted/30'
                  }`}>
                    <div className={`text-2xl mb-2 relative ${badge.earned ? '' : 'grayscale opacity-50'}`}>
                      {badge.badge_icon}
                      {!badge.earned && (
                        <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-sm">
                          <Lock className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className={`text-xs font-medium text-center mb-1 ${badge.earned ? 'text-gray-900 dark:text-gray-100' : 'text-muted-foreground'}`}>
                      {badge.badge_name}
                    </p>
                    <p className={`text-xs text-center line-clamp-2 ${badge.earned ? 'text-gray-700 dark:text-gray-300' : 'text-muted-foreground'}`}>
                      {badge.badge_description}
                    </p>
                    {badge.earned && badge.earned_at && (
                      <p className="text-xs text-accent mt-1">
                        {new Date(badge.earned_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              
              {!showAllBadges && allBadges.length > 9 && (
                <div className="text-center mt-6">
                  <Button 
                    variant="outline" 
                    onClick={handleLoadMore}
                    className="border-accent/30 text-accent hover:bg-accent/10"
                  >
                    Load More Badges ({allBadges.length - 9} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Leaderboards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* 7-day Leaderboard */}
        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="text-lg">Leaderboard (7-day)</CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboardData["7-day"].length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {leaderboardData["7-day"].map((user) => (
                  <div key={user.rank} className="flex items-center space-x-3">
                    {getRankIcon(user.rank)}
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm">{user.name}</span>
                    <span className="text-sm font-semibold text-accent">+{user.points}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 30-day Leaderboard */}
        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="text-lg">Leaderboard (30-day)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboardData["30-day"].map((user) => (
                <div key={user.rank} className="flex items-center space-x-3">
                  {getRankIcon(user.rank)}
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-sm">{user.name}</span>
                  <span className="text-sm font-semibold text-accent">+{user.points}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All-time Leaderboard */}
        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="text-lg">Leaderboard (all-time)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboardData["all-time"].map((user) => (
                <div key={user.rank} className="flex items-center space-x-3">
                  {getRankIcon(user.rank)}
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-sm">{user.name}</span>
                  <span className="text-sm font-semibold text-accent">{user.points}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Last updated: Sep 15th 2025 12:15pm
      </p>
    </div>
  );
};