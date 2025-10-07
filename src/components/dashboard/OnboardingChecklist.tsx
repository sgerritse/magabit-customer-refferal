import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export const OnboardingChecklist = () => {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: checklistData } = useQuery({
    queryKey: ["onboarding-checklist", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Check if user has completed first challenge
      const { data: challenges } = await supabase
        .from("answer_logs")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      // Check if user has generated referral links
      const { data: links } = await supabase
        .from("referral_links")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      // Check if user has set up payout method
      const { data: payoutMethod } = await supabase
        .from("ambassador_payout_methods")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      // Check if user has created landing page
      const { data: landingPage } = await supabase
        .from("ambassador_landing_pages")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      // Check if user has shared a link (at least 1 visit)
      const { data: visits } = await supabase
        .from("referral_visits")
        .select("id")
        .eq("referrer_user_id", user.id)
        .limit(1);

      return {
        completedChallenge: (challenges?.length || 0) > 0,
        generatedLinks: (links?.length || 0) > 0,
        setupPayout: (payoutMethod?.length || 0) > 0,
        createdLandingPage: (landingPage?.length || 0) > 0,
        sharedLink: (visits?.length || 0) > 0,
      };
    },
    enabled: !!user,
  });

  if (!checklistData) return null;

  const items: ChecklistItem[] = [
    { id: "challenge", label: "Complete your first challenge", completed: checklistData.completedChallenge },
    { id: "links", label: "Generate referral links", completed: checklistData.generatedLinks },
    { id: "payout", label: "Set up payout method", completed: checklistData.setupPayout },
    { id: "landing", label: "Create landing page", completed: checklistData.createdLandingPage },
    { id: "share", label: "Share your first referral link", completed: checklistData.sharedLink },
  ];

  const completedCount = items.filter(item => item.completed).length;
  const allCompleted = completedCount === items.length;

  if (allCompleted) return null; // Hide once all completed

  return (
    <Card className="bg-card border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg text-black">Ambassador Onboarding</CardTitle>
            <CardDescription className="text-black/70">
              Complete these steps to get started ({completedCount}/{items.length})
            </CardDescription>
          </div>
          <CheckCircle2 className="h-8 w-8 text-primary opacity-50" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center space-x-3">
              <Checkbox 
                checked={item.completed} 
                disabled 
                className={item.completed ? "border-green-600 data-[state=checked]:bg-green-600" : "border-muted-foreground/50 bg-muted/30"}
              />
              <label
                className={`text-sm text-black ${
                  item.completed ? "line-through text-muted-foreground" : ""
                }`}
              >
                {item.label}
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
