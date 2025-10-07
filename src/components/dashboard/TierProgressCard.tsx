import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp } from "lucide-react";
import { useTierProgress } from "@/hooks/useTierProgress";

const tierColors = {
  bronze: "bg-amber-600",
  silver: "bg-slate-400",
  gold: "bg-yellow-500",
};

const tierTextColors = {
  bronze: "text-amber-600",
  silver: "text-slate-400",
  gold: "text-yellow-500",
};

export const TierProgressCard = () => {
  const { data, isLoading } = useTierProgress();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Commission Tier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-2 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Commission Tier
        </CardTitle>
        <CardDescription>Your current earnings tier and progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Current Tier</p>
            <Badge className={`${tierColors[data.currentTier as keyof typeof tierColors]} text-white capitalize`}>
              {data.currentTier}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Commission Rate</p>
            <p className={`text-2xl font-bold ${tierTextColors[data.currentTier as keyof typeof tierTextColors]}`}>
              {data.rates[data.currentTier as keyof typeof data.rates]}%
            </p>
          </div>
        </div>

        {data.nextTier && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Progress to {data.nextTier}
              </span>
              <span className="font-medium">
                {data.monthlyConversions} / {data.thresholds[data.nextTier as keyof typeof data.thresholds]} conversions
              </span>
            </div>
            <Progress value={data.progress} className="h-2" />
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {data.conversionsNeeded} more conversion{data.conversionsNeeded !== 1 ? "s" : ""} to reach {data.nextTier} tier
            </p>
          </div>
        )}

        {!data.nextTier && (
          <div className="text-center py-4">
            <p className="text-lg font-semibold text-yellow-500">🎉 Maximum Tier Reached!</p>
            <p className="text-sm text-muted-foreground mt-1">
              You're at the highest commission tier
            </p>
          </div>
        )}

        <div className="pt-4 border-t space-y-2">
          <p className="text-sm font-medium">All Commission Tiers</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Bronze (0+ conversions)</span>
              <span className="font-medium">{data.rates.bronze}%</span>
            </div>
            <div className="flex justify-between">
              <span>Silver ({data.thresholds.silver}+ conversions)</span>
              <span className="font-medium">{data.rates.silver}%</span>
            </div>
            <div className="flex justify-between">
              <span>Gold ({data.thresholds.gold}+ conversions)</span>
              <span className="font-medium">{data.rates.gold}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
