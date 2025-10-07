import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trophy, Zap, Eye, Calendar } from "lucide-react";
import { useStats } from "@/contexts/StatsContext";
import { StatsSkeleton } from "@/components/ui/stats-skeleton";
import { useState } from "react";

export const StatsSection = () => {
  const { pointsHistory, badges, totalPoints, loading } = useStats();
  const [showAllPoints, setShowAllPoints] = useState(false);

  if (loading) {
    return <StatsSkeleton />;
  }

  const displayedPoints = showAllPoints ? pointsHistory : pointsHistory.slice(0, 10);

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      <Card 
        className="border-card-border transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
        style={{ backgroundColor: 'hsl(var(--stats-card-bg))' }}
      >
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center space-x-4">
            <div 
              className="p-3 rounded-2xl"
              style={{ backgroundColor: 'hsl(var(--stats-icon-bg))' }}
            >
              <Zap className="w-8 h-8" style={{ color: 'hsl(var(--stats-icon-color))' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'hsl(var(--stats-label-text))' }}>Your Points</h3>
              <div 
                className="text-2xl font-bold mb-2"
                style={{ color: 'hsl(var(--stats-value-text))' }}
              >
                {totalPoints.toLocaleString()}
              </div>
              <div className="flex justify-end">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      View History ({pointsHistory.length})
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-md mx-4">
                  <DialogHeader>
                    <DialogTitle>Points History</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {pointsHistory.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No points earned yet</p>
                        <p className="text-sm mt-1">Complete challenges to earn points!</p>
                      </div>
                    ) : (
                      <>
                       {displayedPoints.map((entry) => (
                          <div 
                            key={entry.id} 
                            className="flex justify-between items-start p-3 rounded-lg"
                            style={{ 
                              backgroundColor: 'hsl(var(--stats-card-bg))',
                              border: '1px solid hsl(var(--stats-card-border))'
                            }}
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">{entry.reason}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(entry.created_at).toLocaleDateString()}
                              </div>
                              {entry.source_type !== 'manual' && (
                                <span 
                                  className="inline-block px-2 py-1 text-xs rounded-full mt-1"
                                  style={{
                                    backgroundColor: 'hsl(var(--stats-icon-bg))',
                                    color: 'hsl(var(--stats-icon-color))'
                                  }}
                                >
                                  {entry.source_type}
                                </span>
                              )}
                            </div>
                            <div 
                              className="font-bold"
                              style={{ color: 'hsl(var(--stats-value-text))' }}
                            >
                              +{entry.points}
                            </div>
                          </div>
                        ))}
                        {!showAllPoints && pointsHistory.length > 10 && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setShowAllPoints(true)}
                            className="w-full"
                          >
                            Load More ({pointsHistory.length - 10} more)
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card 
        className="border-card-border transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
        style={{ backgroundColor: 'hsl(var(--stats-card-bg))' }}
      >
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 badge-gradient rounded-2xl">
              <Trophy className="w-8 h-8 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'hsl(var(--stats-label-text))' }}>Badges Earned</h3>
              <div 
                className="text-2xl font-bold mb-2"
                style={{ color: 'hsl(var(--stats-value-text))' }}
              >
                {badges.length}
              </div>
              <div className="flex justify-end">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      View Badges ({badges.length})
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-md mx-4">
                  <DialogHeader>
                    <DialogTitle>Your Badges</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {badges.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No badges earned yet</p>
                        <p className="text-sm mt-1">Complete challenges to unlock badges!</p>
                      </div>
                    ) : (
                      badges.map((badge) => (
                        <div 
                          key={badge.id} 
                          className="flex items-start gap-3 p-3 rounded-lg"
                          style={{
                            backgroundColor: 'hsl(var(--stats-card-bg))',
                            border: '1px solid hsl(var(--stats-card-border))'
                          }}
                        >
                          <div className="text-2xl">{badge.badge_icon}</div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{badge.badge_name}</h4>
                            <p className="text-sm text-muted-foreground mb-1">{badge.badge_description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                Earned {new Date(badge.earned_at).toLocaleDateString()}
                              </div>
                              {badge.points_awarded > 0 && (
                                <span 
                                  className="text-xs px-2 py-1 rounded-full"
                                  style={{
                                    backgroundColor: 'hsl(var(--stats-icon-bg))',
                                    color: 'hsl(var(--stats-icon-color))'
                                  }}
                                >
                                  +{badge.points_awarded} pts
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};